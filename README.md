# AI-Powered Disaster Detection System (Full-Stack Prototype)

## 🚀 Overview

Manual disaster analysis is often slow and inefficient.  
This project presents a **full-stack AI-powered disaster detection system prototype** that combines intelligent text analysis, backend processing, and real-time alerting.

It is designed as a **hackathon-ready implementation** of a scalable real-world system.

---

## 🏗️ Architecture

Frontend (HTML/CSS/JS) → Backend (Node.js + Express) → AI API → Storage

---

## 🎯 Objectives

- Detect disasters faster using AI-based analysis  
- Process unstructured text inputs intelligently  
- Provide risk classification and alerts  
- Demonstrate a scalable architecture for real-world deployment  

---

## ⚙️ Features

### 🔹 1. AI-Based Disaster Detection
- Accepts natural language input  
- Detects **any disaster type (not keyword-limited)**  
- Returns:
  - Disaster Type  
  - Risk Level (Low / Medium / High)  
  - Confidence Score  
  - AI-generated Summary  

---

### 🔹 2. Backend API
- Endpoint: `POST /api/analyze`
- Processes input using AI
- Includes fallback rule-based logic

---

### 🔹 3. Dashboard
- Displays previous reports  
- Shows timestamps and results  
- Simulates real-time monitoring system  

---

### 🔹 4. Alert System
- 🚨 High-risk events trigger emergency alerts  

---

### 🔹 5. Storage
- Uses in-memory storage (for prototype)
- Can be extended to:
  - Supabase  
  - PostgreSQL  

---

## 🧠 System Capabilities (Conceptual Vision)

This prototype represents a simplified version of a larger AI system that could include:

- Multi-modal data processing (text, images, satellite)
- Geo-mapping and visualization
- Real-time disaster monitoring
- Integration with emergency services
- Edge AI deployment for remote regions

---

## 🏗️ Project Structure

