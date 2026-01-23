export const parseAspectRatio = (aspect?: string, mediaType?: string): number => {
    if (!aspect) {
        return mediaType === "video" ? 16 / 9 : 3 / 4;
    }

    const parts = aspect.split("/").map(Number);
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return mediaType === "video" ? 16 / 9 : 3 / 4;
    }

    if (mediaType === 'video') {
        return 3 / 4;
    }

    return parts[0] / parts[1];
};