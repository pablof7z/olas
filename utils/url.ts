export async function determineMimeType(uri: string) {
    // read the file and get the mime type
    const fileContent = await fetch(uri).then((response) => response.blob());
    const mimeType = fileContent.type;

    return mimeType;
}
