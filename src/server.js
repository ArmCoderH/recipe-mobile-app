import express from 'express';
import { ENV } from './config/env.js';
import { db } from './config/db.js';
import { favoritesTable } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import job from './config/cron.js';

const app = express();
const PORT = ENV.PORT || 5001;

if(ENV.NODE_ENV === "production"){
    job.start();
}

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true });
});

//add favorite api
app.post("/api/favorite", async (req, res) => {
    try {
        const { userId, recipeId, title, image, cookTime, servings } = req.body;
        if (!userId || !recipeId || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newFavorite = await db.insert(favoritesTable).values({
            userId,
            recipeId,
            title,
            image,
            cookTime,
            servings
        }).returning();
        if (!newFavorite || newFavorite.length === 0) {
            return res.status(500).json({ error: "Failed to add favorite" });
        }
        res.status(201).json(newFavorite[0]);
    } catch (err) {
        console.error("Error adding favorite:", err);
        res.status(500).json({ error: "Failed to add favorite" });
    }
});

//fetch api
app.get("/api/favorite/:userid", async (req, res) => {
    try {
        const { userid } = req.params;
        const favorites = await db.select().from(favoritesTable).where(
            eq(favoritesTable.userId, userid)
        );
        res.status(200).json(favorites);
    } catch (err) {
        console.error("Error fetching favorites:", err);
        res.status(500).json({ error: "Failed to fetch favorites" });
    }
});

//delete api 
app.delete("/api/favorite/:userid/:recipeid", async (req, res) => {
    try {
        const { userid, recipeid } = req.params;
        const recipeIdNum = parseInt(recipeid);
        if (isNaN(recipeIdNum)) {
            return res.status(400).json({ error: "Invalid recipe ID" });
        }
        await db.delete(favoritesTable).where(
            and(
                eq(favoritesTable.userId, userid),
                eq(favoritesTable.recipeId, recipeIdNum)
            )
        );
        res.status(200).json({ message: "Favorite deleted successfully" });
    } catch (err) {
        console.error("Error deleting favorite:", err);
        res.status(500).json({ error: "Failed to delete favorite" });
    }
});

app.listen(PORT, () => {
    console.log("Server is running on PORT:", PORT);
});