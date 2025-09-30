# Business Simulator Game Plan

## 🎯 Game Overview

Transform the existing BusinessSpark into a comprehensive business simulation where players make daily strategic decisions, manage equipment, employees, and resources while tracking their progress through detailed financial statements.

## 🏗️ Core Game Mechanics

### **Starting Conditions**
- **Initial Capital**: $1,000 cash
- **Starting Assets**: None (must buy equipment and hire employees)
- **Game Duration**: 30 days
- **Objective**: Maximize profit and business value

### **Daily Decision Structure**
Each day, players choose between two options:
1. **Investment Decision** (Costs Money) - Expand/maintain business
2. **Operations Decision** (Makes Money) - Focus on production and sales

## 💰 Equipment System

### **3D Printers (Production Equipment)**
- **Purchase Cost**: $200 per printer
- **Production Capacity**: 5 items per day per printer
- **Operational Life**: 5 days before requiring repair
- **Repair Cost**: $50 per printer
- **Repair Time**: 1 day (printer offline during repair)

### **Equipment States**
- **New**: Just purchased, fully operational
- **Working**: Operational, days remaining until repair needed
- **Needs Repair**: Non-functional, requires maintenance
- **Under Repair**: Being fixed, unavailable for 1 day

## 👥 Employee System

### **Worker Roles**
- **Operators**: Can run 3D printers to produce items
- **Hire Cost**: $100 per employee
- **Daily Salary**: $25 per employee per day
- **Productivity**: 1 operator per printer maximum

### **Employment Mechanics**
- Employees work every day they're employed
- Can hire multiple employees in one decision
- No firing mechanism (simplicity)
- Employees needed to operate equipment

## 📦 Production & Sales System

### **Item Production**
- **Production Rate**: 5 items per printer per day (if operated)
- **Production Requirements**:
  - Working 3D printer
  - Assigned operator
  - Raw materials
- **Material Cost**: $20 per item produced

### **Sales Mechanics**
- **Selling Price**: $100 per item
- **Material Cost**: $20 per item
- **Gross Profit**: $80 per item
- **All produced items sell immediately** (no inventory management)

## 🎮 Daily Decision Options

### **Investment Decisions** (Cost Money)
1. **Buy 3D Printer** - $200
   - Increases production capacity
   - Requires operator to function

2. **Hire Employee** - $100 upfront + $25/day ongoing
   - Enables operation of printers
   - Can hire multiple in one decision

3. **Repair Equipment** - $50 per printer
   - Fixes broken printers
   - Printer unavailable for 1 day during repair

4. **Buy Materials in Bulk** - $150
   - Purchases materials for 10 items
   - Cheaper than daily production cost ($15/item vs $20/item)

### **Operations Decisions** (Make Money)
1. **Full Production** - Daily operations
   - All working printers produce items
   - Pay all employee salaries
   - Generate revenue from sales

2. **Focused Sales & Marketing** - +20% sales price for the day
   - Items sell for $120 instead of $100
   - Represents marketing push or premium positioning

## 📊 Financial Statements System

### **Income Statement** (Profit & Loss)
```
Revenue:
- Sales Revenue: [Items Sold] × $100
- Marketing Bonus: [if applicable]

Expenses:
- Materials Cost: [Items Produced] × $20
- Employee Salaries: [Employees] × $25
- Equipment Repairs: [Printers Repaired] × $50
- Depreciation: [Printers Owned] × $5/day

Net Income: Revenue - Expenses
```

### **Balance Sheet**
```
Assets:
- Cash: [Current Cash]
- Equipment (3D Printers): [Printers] × $200
- Less: Accumulated Depreciation
- Materials Inventory: [Materials on Hand] × $15

Liabilities:
- Accrued Salaries: [if any unpaid]

Equity:
- Starting Capital: $1,000
- Retained Earnings: [Cumulative Profits]
```

### **Cash Flow Statement**
```
Operating Activities:
- Net Income: [from Income Statement]
- Depreciation: [non-cash expense]
- Changes in Materials Inventory

Investing Activities:
- Equipment Purchases: [Printers Bought] × $200
- Equipment Repairs: [Repairs] × $50

Financing Activities:
- Initial Investment: $1,000 (Day 1 only)

Net Change in Cash
```

## 🎨 UI/UX Design

### **Daily Decision Screen**
```
Day [X] of 30

Current Status:
💰 Cash: $XXX
🏭 Printers: X working, X need repair
👥 Employees: X operators
📦 Materials: X units

Choose Your Strategy:
[Investment Option] - Cost: $XXX
[Operations Option] - Potential Revenue: $XXX
```

### **Financial Reports Screen**
```
📊 Financial Summary - Day [X]

[Income Statement with changes highlighted]
[Balance Sheet with changes highlighted]
[Cash Flow with changes highlighted]

Key Metrics:
- Daily Profit: $XXX
- Total Equity: $XXX
- ROI: XX%
```

### **Change Highlighting System**
- **Strikethrough**: ~~Old values~~
- **Bold**: **New values**
- **Green**: Positive changes
- **Red**: Negative changes

## 🔧 Technical Implementation

### **Game State Structure**
```typescript
interface GameState {
  day: number;
  cash: number;
  employees: number;
  printers: Printer[];
  materialsInventory: number;
  dailyRevenue: number;
  dailyExpenses: number;
  cumulativeProfit: number;
  previousFinancials: FinancialSnapshot;
}

interface Printer {
  id: string;
  purchaseDay: number;
  daysUsed: number;
  status: 'working' | 'needs_repair' | 'under_repair';
  repairDay?: number;
}

interface FinancialSnapshot {
  cash: number;
  revenue: number;
  expenses: number;
  netIncome: number;
  totalAssets: number;
  totalEquity: number;
}
```

### **Decision Processing Logic**
1. **Validate Decision** - Check if player can afford choice
2. **Process Decision** - Update game state
3. **Calculate Daily Operations** - Automatic production/sales
4. **Update Financials** - Generate statements
5. **Advance Day** - Progress equipment aging, check win/lose conditions

### **Random Events** (Optional Enhancement)
- Equipment breakdowns (low probability)
- Market fluctuations (±10% selling price)
- Bulk order opportunities (+50% sales for day)
- Material shortages (increased costs)

## 🏆 Scoring & Victory Conditions

### **Success Metrics**
- **Total Equity** at end of 30 days
- **Average Daily Profit** over last 10 days
- **ROI** - (Final Equity - $1,000) / $1,000 × 100%

### **Performance Tiers**
- **Struggling**: <$1,500 equity
- **Profitable**: $1,500 - $3,000 equity
- **Successful**: $3,000 - $5,000 equity
- **Business Mogul**: >$5,000 equity

### **Bankruptcy Condition**
- If cash drops below $0 and can't pay daily expenses
- Game ends early with failure message

## 🎯 Key Features for Implementation

### **Phase 1: Core Mechanics**
1. Daily decision system
2. Equipment and employee management
3. Basic financial calculations
4. Simple financial statements

### **Phase 2: Enhanced UI**
1. Change highlighting in financial statements
2. Visual equipment/employee indicators
3. Progress tracking and metrics
4. Enhanced styling and animations

### **Phase 3: Advanced Features**
1. Random events
2. More decision variety
3. Detailed business analytics
4. Save/load game state

## 📱 Mobile Optimization

### **Touch-Friendly Design**
- Large decision buttons
- Swipeable financial statement tabs
- Collapsible detailed views
- Clear visual hierarchy

### **Performance Considerations**
- Efficient state management
- Optimized re-renders for financial updates
- Smooth transitions between days
- Memory-efficient data structures

## 🧪 Testing Strategy

### **Game Balance Testing**
- Ensure both strategies can be profitable
- Verify equipment repair timing creates interesting decisions
- Test edge cases (no employees, no equipment, etc.)
- Validate financial calculation accuracy

### **User Experience Testing**
- Intuitive decision-making flow
- Clear financial statement readability
- Appropriate game pacing
- Satisfying progression feedback

This comprehensive business simulation will provide an engaging, educational experience that teaches business fundamentals while being fun and challenging to play!