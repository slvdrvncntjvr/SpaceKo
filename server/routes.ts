import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes - all prefixed with /api
  
  // Resources API
  app.get("/api/resources", async (req, res) => {
    try {
      const { wing, floor, category } = req.query;
      let resources;
      
      if (wing && floor) {
        resources = await storage.getResourcesByWingAndFloor(wing as string, parseInt(floor as string));
      } else if (wing) {
        resources = await storage.getResourcesByWing(wing as string);
      } else if (category) {
        resources = await storage.getResourcesByCategory(category as string);
      } else {
        resources = await storage.getResources();
      }
      
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResourceById(id);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      res.json(resource);
    } catch (error) {
      console.error("Error fetching resource:", error);
      res.status(500).json({ error: "Failed to fetch resource" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resource = await storage.createResource(req.body);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Error creating resource:", error);
      res.status(500).json({ error: "Failed to create resource" });
    }
  });

  app.put("/api/resources/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.updateResource(id, req.body);
      
      if (!resource) {
        return res.status(404).json({ error: "Resource not found" });
      }
      
      res.json(resource);
    } catch (error) {
      console.error("Error updating resource:", error);
      res.status(500).json({ error: "Failed to update resource" });
    }
  });

  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const contributors = await storage.getContributors();
      res.json(contributors);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:username", async (req, res) => {
    try {
      const contributor = await storage.getContributorByUsername(req.params.username);
      
      if (!contributor) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(contributor);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const contributor = await storage.createContributor(req.body);
      res.status(201).json(contributor);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Authentication API
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { userCode } = req.body;
      
      if (!userCode) {
        return res.status(400).json({ error: "User code is required" });
      }
      
      // Validate user code format
      const isValid = await storage.validateUserCode(userCode);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid user code format" });
      }
      
      // Create session
      const session = await storage.createSession({
        userCode,
        userType: "student", // Default type, could be enhanced
        username: userCode // Using userCode as username for now
      });
      
      res.json({
        message: "Login successful",
        sessionId: session.id,
        userCode
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { userCode } = req.body;
      
      if (!userCode) {
        return res.status(400).json({ error: "User code is required" });
      }
      
      // In a real app, you'd invalidate the session
      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({ error: "Logout failed" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
