# 🤖 AI Algorithms - Theft Detection & Inventory Reconciliation

This folder contains all **AI algorithms and research** for the Smart Loss Control project.

## 📁 Folder Structure

```
ai-algorithms/
├── algorithms/          # Core AI algorithms (Python)
│   ├── inventory_engine_v2.py      # Stock calculation engine
│   └── anomaly_detection_v2.py     # Trigger & pattern detection
├── test-data/          # Sample datasets for testing
│   └── simulation_dataset.json     # 24-hour simulation data
├── notebooks/          # Jupyter notebooks for demos
│   └── DEMO_NOTEBOOK.ipynb         # Algorithm demonstration
├── research/           # Research docs & experiments (future)
└── README.md           # This file
```

---

## 🎯 Core Algorithms

### 1. Inventory Engine (`algorithms/inventory_engine_v2.py`)

**Purpose:** Calculate expected stock and detect variance

**Core Formula:**
```python
Expected Stock = Initial + (Cartons × 12) - Units Sold
```

**Key Methods:**
- `calculate_expected()` - Calculate expected stock
- `calculate_variance()` - Compare expected vs actual
- `calculate_loss()` - Financial impact calculation
- `validate_delivery()` - Supplier variance detection
- `log_decant()` - Audit trail for carton unpacking

**Backend Integration:** ✅ Implemented in `src/controllers/aiController.js` (verifyCount function)

---

### 2. Anomaly Detection (`algorithms/anomaly_detection_v2.py`)

**Purpose:** Trigger spot checks based on sales patterns

**Trigger Types:**
1. **RANDOM** (20% probability) - Random security checks
2. **VOLUME** (2× average) - Sales spike detection
3. **TIME** (4+ hours) - Time since last count
4. **COUNTER** (10+ sales) - Sales volume threshold

**Severity Levels:**
- **GREEN** - ≤1% variance (OK)
- **YELLOW** - 1-10% variance (Warning)
- **RED** - >10% variance (Critical Alert)

**Pattern Detection:**
- End-of-shift spike (10+ sales in last 30 min)
- Extended gap (4+ hours no sales)
- Consecutive high sales
- Inventory mismatch

**Backend Integration:** ✅ Implemented in `src/controllers/aiController.js` (triggerCount function)

---

## 📊 Test Data

### Simulation Dataset (`test-data/simulation_dataset.json`)

24-hour simulation with:
- 150+ transactions
- Multiple SKUs (King's Oil, Mamador, Devon Kings)
- Various trigger scenarios
- Realistic sales patterns

**Use Cases:**
- Algorithm testing
- Backend endpoint validation
- UI/UX prototyping
- Performance benchmarking

---

## 📓 Notebooks

### Demo Notebook (`notebooks/DEMO_NOTEBOOK.ipynb`)

Interactive Jupyter notebook demonstrating:
- Algorithm execution
- Trigger detection
- Variance calculation
- Pattern analysis
- Visual charts

**To Run:**
```bash
cd datascience/notebooks
jupyter notebook DEMO_NOTEBOOK.ipynb
```

---

## 🔗 Backend Integration Status

| Algorithm | Backend Endpoint | Status | Controller |
|-----------|-----------------|--------|------------|
| Anomaly Detection | `GET /ai/trigger-count` | ✅ Complete | `aiController.js` |
| Inventory Engine | `POST /audit/verify` | 🚧 In Progress | `aiController.js` |
| Sales Velocity | `GET /ai/sales-velocity` | ⏳ Planned | - |
| Theft Patterns | `GET /ai/theft-patterns` | ⏳ Planned | - |

---

## 🧑‍🔬 AI/ML Team Workflow

### 1. Algorithm Development
- Develop algorithms in Python (this folder)
- Test with simulation data
- Document in Jupyter notebooks
- Share findings with backend team

### 2. Backend Translation
- Backend team implements in Node.js
- Maintains same logic & formulas
- Creates REST API endpoints
- Adds database integration

### 3. Testing & Validation
- Compare Python vs Node.js results
- Validate with test data
- Performance benchmarking
- Edge case testing

---

## 📝 Algorithm Specifications

### Trigger Priority Levels
```
Priority 3 (Highest): VOLUME - Sales spike
Priority 2 (Medium):  RANDOM, TIME
Priority 1 (Low):     COUNTER
```

### Variance Thresholds
```
GREEN:  variance ≤ 1%
YELLOW: 1% < variance ≤ 10%
RED:    variance > 10%
```

### Time Windows
```
Sales velocity:     7-day rolling average
Spike detection:    Last 1 hour vs 7-day avg
Time trigger:       4+ hours since last count
Counter trigger:    10+ sales since last count
```

---

## 🚀 Quick Start for AI/ML Engineers

### Setup Python Environment
```bash
cd ai-algorithms
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run Algorithms
```python
# Test inventory engine
python algorithms/inventory_engine_v2.py

# Test anomaly detection
python algorithms/anomaly_detection_v2.py
```

### Load Test Data
```python
import json

with open('test-data/simulation_dataset.json', 'r') as f:
    data = json.load(f)
    
print(f"Loaded {len(data['transactions'])} transactions")
```

---

## 📚 Documentation

- **Integration Plan:** `../AI_ALGORITHMS_INTEGRATION_PLAN.md`
- **AI Guide:** `../AI_INTEGRATION_GUIDE.md`
- **API Docs:** `../docs/openapi.yaml`
- **Backend Code:** `../src/controllers/aiController.js`

---

## 🤝 Collaboration

### For AI/ML Engineers:
- Keep algorithms in Python (this folder)
- Document all formulas and thresholds
- Provide test data and expected results
- Update notebooks with examples

### For Backend Developers:
- Implement algorithms in Node.js (`src/controllers/`)
- Maintain formula accuracy
- Add database integration
- Create REST API endpoints
- Update OpenAPI documentation

---

## 📧 Contact

**AI/ML Team Lead:** [Contact Info]  
**Backend Team Lead:** [Contact Info]  
**Project Manager:** [Contact Info]

---

**Last Updated:** February 24, 2026  
**Version:** 2.0.0
