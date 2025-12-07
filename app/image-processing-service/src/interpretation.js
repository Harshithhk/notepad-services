export const interpretation = async (noteId, imageUrl) => {
    console.log(`Starting interpretation of note ${noteId} with image ${imageUrl}`);

    // Simulated processing
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log(`Interpretation completed for note ${noteId}`);
};
