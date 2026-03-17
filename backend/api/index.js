const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Supabase Client (Service Role for backend ops, or standard depending on use case)
// Since we use RLS, we should ideally instantiate a client per request using the user's JWT
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware to attach user from Supabase JWT
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  req.user = user;
  
  // Create a supabase client with the user's jwt for RLS
  req.supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  next();
};

app.get("/", (req, res) => res.send("Bharat Money Manager API is running."));

// Get Transactions
app.get("/api/transactions", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("transactions")
      .select("*, categories(name, icon)")
      .order("date", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add Transaction
app.post("/api/transactions", authenticateUser, async (req, res) => {
  try {
    const { amount, type, description, date, category_id } = req.body;
    
    // Validate
    if (!amount || !type || !date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await req.supabase
      .from("transactions")
      .insert([{ 
        user_id: req.user.id, 
        amount, 
        type, 
        description, 
        date, 
        category_id 
      }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Transaction
app.delete("/api/transactions/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await req.supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Categories
app.get("/api/categories", authenticateUser, async (req, res) => {
    try {
      const { data, error } = await req.supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
  
      if (error) throw error;
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Add Category
app.post("/api/categories", authenticateUser, async (req, res) => {
    try {
      const { name, type, icon } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }
  
      const { data, error } = await req.supabase
        .from("categories")
        .insert([{ 
          user_id: req.user.id, 
          name, 
          type, 
          icon 
        }])
        .select();
  
      if (error) throw error;
      res.status(201).json(data[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

// Local Server Startup
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

// Export the Express app for Vercel
module.exports = app;
