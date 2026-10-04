import { useMutation, useQueryClient } from "@tanstack/react-query";

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => ({}));
  return data.error ?? "Erreur réseau.";
}

export function useUpdateUsername() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (username: string): Promise<void> => {
      const res = await fetch("/api/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username }),
      });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

/** Recadre en carré et redimensionne en JPEG 256x256 avant l'envoi. */
async function resizeToSquareJpeg(file: File, size = 256): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Image illisible."));
      el.src = url;
    });

    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Traitement de l'image impossible.");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Traitement de l'image impossible.")),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<void> => {
      if (!file.type.startsWith("image/")) {
        throw new Error("Le fichier doit être une image.");
      }
      const blob = await resizeToSquareJpeg(file);
      const form = new FormData();
      form.append("avatar", blob, "avatar.jpg");
      const res = await fetch("/api/me/avatar", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}

export function useDeleteAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const res = await fetch("/api/me/avatar", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readError(res));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
