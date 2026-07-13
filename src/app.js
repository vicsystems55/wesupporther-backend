import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";


const app = express();

app.set("trust proxy", 1);

app.use(cors());

app.use(express.json());



app.use(
    "/api/auth",
    authRoutes
);

app.use("/api/volunteer-applications", volunteerRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/admin", adminRoutes);



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
