import { supabase } from "../../SupabaseCredentials";

export async function uploadAvatar(file, userId, currentAvatarUrl) {
	if (!file) throw new Error("No file provided");

	const isDefaultAvatar =
		!currentAvatarUrl || currentAvatarUrl.includes("userdefault.jpg");

	if (!isDefaultAvatar) {
		const pathToDelete = currentAvatarUrl?.split("/Avatars/")[1];

		if (pathToDelete) {
			console.log("🗑️ Eliminando avatar anterior:", pathToDelete);

			const { error } = await supabase.storage
				.from("Avatars")
				.remove([pathToDelete]);

			if (error) {
				console.warn("⚠️ No se pudo borrar avatar anterior:", error);
			}
		}
	} else {
		console.log("ℹ️ Avatar default detectado, no se elimina");
	}

	const ext = file.name.split(".").pop();
	const fileName = `${userId}-${Date.now()}.${ext}`;

	console.log("⬆️ Subiendo nuevo avatar:", fileName);

	const { error: uploadError } = await supabase.storage
		.from("Avatars")
		.upload(fileName, file, {
			cacheControl: "3600",
			contentType: file.type,
		});

	if (uploadError) {
		console.error("❌ Error upload:", uploadError);
		throw uploadError;
	}

	const { data } = supabase.storage.from("Avatars").getPublicUrl(fileName);

	console.log("✅ Nuevo avatar URL:", data.publicUrl);

	return data.publicUrl;
}
