import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import publicPostRoutes from "./routes/publicPostRoutes.js";


const app = express();

app.set("trust proxy", 1);

const normalizeOrigin = (origin) => origin.trim().replace(/\/$/, "");
const allowedOrigins = new Set([
    "http://localhost:5173",
    "https://wesupporther.org",
    "https://www.wesupporther.org",
    ...(process.env.FRONTEND_URL || "").split(","),
].map(normalizeOrigin).filter(Boolean));

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
            return callback(null, true);
        }
        return callback(null, false);
    },
}));

app.use(express.json({ limit: "2mb" }));



app.use(
    "/api/auth",
    authRoutes
);

app.use("/api/volunteer-applications", volunteerRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", contactRoutes);
app.use("/api", publicPostRoutes);



app.get("/",(req,res)=>{

    res.json({
        message:"We Support Her API Running"
    });

});

app.get("/api/health", (req, res) => {

    res.json({
        status: "ok",
        service: "We Support Her API",
        timestamp: new Date()
    });

});


export default app;
