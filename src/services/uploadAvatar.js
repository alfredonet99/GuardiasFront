import { supabase } from "../../SupabaseCredentials";
import { devLog, devError } from "../utils/devLogs";

export async function uploadAvatar(file, userId, currentAvatarUrl) {
	if (!file) throw new Error("No file provided");

	const isDefaultAvatar =
		!currentAvatarUrl || currentAvatarUrl.includes("userdefault.jpg");

	if (!isDefaultAvatar) {
		const pathToDelete = currentAvatarUrl?.split("/Avatars/")[1];

		if (pathToDelete) {
			devLog("🗑️ Eliminando avatar anterior:", pathToDelete);

			const { error } = await supabase.storage
				.from("Avatars")
				.remove([pathToDelete]);

			if (error) {
				devError("⚠️ No se pudo borrar avatar anterior:", error);
			}
		}
	} else {
		devLog("ℹ️ Avatar default detectado, no se elimina");
	}

	const ext = file.name.split(".").pop();
	const fileName = `${userId}-${Date.now()}.${ext}`;

	devLog("⬆️ Subiendo nuevo avatar:", fileName);

	const { error: uploadError } = await supabase.storage
		.from("Avatars")
		.upload(fileName, file, {
			cacheControl: "3600",
			contentType: file.type,
		});

	if (uploadError) {
		devError("❌ Error upload:", uploadError);
		throw uploadError;
	}

	const { data } = supabase.storage.from("Avatars").getPublicUrl(fileName);

	devLog("✅ Nuevo avatar URL:", data.publicUrl);

	return data.publicUrl;
}
