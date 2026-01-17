export const parseAspectRatio = (aspect?: string, mediaType?: string): number => {
    if (!aspect) {
        return mediaType === "video" ? 16 / 9 : 4 / 3;
    }

    const parts = aspect.split("/").map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return mediaType === "video" ? 16 / 9 : 4 / 3;
    }

    return parts[0] / parts[1];
};