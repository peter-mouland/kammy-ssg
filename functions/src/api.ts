import { onRequest } from "firebase-functions/v2/https";

export const api = onRequest({ cors: true }, async (req, res) => {
    res.json({ status: 'ok', path: req.path });
});
