export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL parameter is required" });
    }

    try {
        const response = await fetch(url, { method: "HEAD" });
        const fileSize = response.headers.get("content-length");

        if (fileSize) {
            res.status(200).json({ size: parseInt(fileSize, 10) });
        } else {
            res.status(404).json({ error: "File size not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error fetching the file" });
    }
}