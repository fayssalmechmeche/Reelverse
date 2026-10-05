<?php

namespace App\User\Validation;

use App\User\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class UniqueIgnoreCaseValidator extends ConstraintValidator
{
    /** Champs autorisés (évite d'injecter un nom de champ arbitraire dans la requête). */
    private const ALLOWED_FIELDS = ['email', 'username'];

    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof UniqueIgnoreCase) {
            throw new UnexpectedTypeException($constraint, UniqueIgnoreCase::class);
        }

        if ($value === null || $value === '') {
            return;
        }

        if (!is_string($value)) {
            throw new UnexpectedValueException($value, 'string');
        }

        if (!in_array($constraint->field, self::ALLOWED_FIELDS, true)) {
            throw new \LogicException(sprintf('Champ non autorisé : %s', $constraint->field));
        }

        $qb = $this->em->createQueryBuilder()
            ->select('COUNT(u.id)')
            ->from(User::class, 'u')
            ->where(sprintf('LOWER(u.%s) = :value', $constraint->field))
            ->setParameter('value', mb_strtolower($value));

        if ($constraint->excludeCurrentUser) {
            $current = $this->security->getUser();
            if ($current instanceof User && $current->getId() !== null) {
                $qb->andWhere('u.id != :currentId')->setParameter('currentId', $current->getId());
            }
        }

        if ((int) $qb->getQuery()->getSingleScalarResult() > 0) {
            $this->context->buildViolation($constraint->message)->addViolation();
        }
    }
}
