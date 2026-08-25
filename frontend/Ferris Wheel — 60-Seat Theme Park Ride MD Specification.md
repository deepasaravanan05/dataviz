# Ferris Wheel — 60-Seat Theme Park Ride

## 1. Objective

Create **only the Ferris Wheel ride** for the employee theme park project.

The Ferris Wheel must visually and mechanically resemble the provided Sketchfab reference as closely as reasonably possible, while implementing the project's own requirements:

- **60 total seats/cabins**
- **Green, yellow, and red seat categories**
- Realistic Ferris Wheel structure and rotation
- Professional 3D theme-park appearance
- Suitable for integration into the larger employee theme park later
- Do **not** create any other rides or park attractions

---

## 2. Reference Model

Use this Sketchfab model as the primary visual and mechanical reference:

https://sketchfab.com/3d-models/ferris-wheel-e331d33fe34b452eab9cccb8f645aeaa

Target approximately **95% similarity in overall visual impression**, including:

- Overall Ferris Wheel silhouette
- Wheel size and proportions
- Support structure
- Central hub
- Spokes
- Cabin arrangement
- Cabin proportions
- Cabin suspension
- Mechanical construction
- Rotation behavior
- Realistic theme-park appearance

The goal is **reference-inspired recreation**, not an unrelated Ferris Wheel design.

---

## 3. License Verification

Before directly downloading, importing, modifying, or reusing the Sketchfab model:

1. Check the model's **current Sketchfab license**.
2. Verify whether commercial/project reuse is permitted.
3. Check whether attribution is required.
4. Follow all applicable attribution requirements.
5. If direct reuse is not permitted, **do not copy or redistribute the original asset**.
6. Instead, recreate the Ferris Wheel in Blender using the reference only as a visual/mechanical reference.

The final project should contain an original recreation when direct asset reuse is not legally permitted.

---

# 4. Ferris Wheel Requirements

## Total Capacity

The Ferris Wheel must contain exactly:

**60 seats/cabins**

Do not create 20, 30, 40, 50, or another number of cabins.

The final visible ride must clearly communicate that the Ferris Wheel has **60 passenger positions**.

---

# 5. Seat Color Categories

Use exactly three seat categories:

### 🟢 Green

Represents:

**Normal / On-time / Immediate Start**

### 🟡 Yellow

Represents:

**Small Delay / Quick Transition**

### 🔴 Red

Represents:

**High Delay / Long Transition**

The three colors should be distributed around the Ferris Wheel rather than grouped into one section.

Recommended distribution:

- **20 Green**
- **20 Yellow**
- **20 Red**

Total:

**20 + 20 + 20 = 60 seats**

---

# 6. Cabin Arrangement

The 60 cabins should be arranged evenly around the Ferris Wheel circumference.

Requirements:

- Equal angular spacing
- Same cabin size
- Same cabin geometry
- Same suspension mechanism
- Each cabin remains visually upright as the wheel rotates
- Cabins should naturally hang from their suspension points
- No floating cabins
- No overlapping cabins
- No unrealistic spacing

The arrangement should resemble the reference Ferris Wheel's cabin distribution as closely as possible.

---

# 7. Ferris Wheel Structure

Recreate the major structural components visible in the reference.

## Main Components

### A. Wheel Rim

- Large circular wheel
- Strong structural appearance
- Realistic thickness
- Continuous circular frame
- Appropriate mechanical detailing

### B. Central Hub

- Large central mechanical hub
- Positioned exactly at the wheel center
- Connected to the spokes
- Realistic engineering proportions

### C. Spokes

Create multiple radial spokes connecting:

**Central Hub → Outer Wheel Rim**

Requirements:

- Evenly distributed
- Symmetrical
- Structurally believable
- Consistent thickness
- Proper connection to the hub and rim

### D. Support Towers

Use a strong supporting structure similar to the reference.

The supports should:

- Hold the wheel securely
- Extend from the ground to the wheel hub area
- Have realistic structural thickness
- Be symmetrical
- Look capable of supporting the entire rotating wheel

### E. Base

Create a realistic ground/base connection.

The Ferris Wheel must not appear to float.

---

# 8. Mechanical Behavior

The Ferris Wheel must behave like a real Ferris Wheel.

## Rotation

The complete wheel should rotate around its central horizontal axis.

The rotation must be:

- Smooth
- Continuous
- Slow
- Realistic
- Centered correctly

The cabins should not rotate together with the wheel orientation.

Instead, the cabins should remain approximately upright through a proper suspension/pivot mechanism.

---

# 9. Cabin/Pivot Behavior

Each cabin should be attached to the outer wheel through a pivot or hanging mechanism.

When the wheel rotates:

```text
Wheel rotates
      ↓
Cabin attachment moves
      ↓
Cabin swings/hangs naturally
      ↓
Cabin remains upright
```

Avoid:

- Fixed cabins that rotate upside down
- Floating cabins
- Cabins disconnected from the wheel
- Unrealistic rotation
- Cabins penetrating the wheel structure

---

# 10. Realism Requirements

The model should look like a **real physical theme-park Ferris Wheel**, not a simple geometric illustration.

Include realistic:

- Metal structural components
- Bolted/jointed appearance where appropriate
- Wheel frame
- Hub
- Spokes
- Support beams
- Cabin suspension
- Cabin seats
- Mechanical connections
- Ground supports

Use appropriate bevels and smooth shading so the model does not look excessively low-poly.

---

# 11. 3D Modeling Quality

The Ferris Wheel should be:

- Cleanly modeled
- Symmetrical
- Properly scaled
- Professionally organized
- Free from unnecessary geometry
- Suitable for real-time visualization
- Visually detailed but optimized

Use reusable components where possible.

For example:

```text
1 Cabin Model
      ↓
Duplicate × 60
      ↓
Arrange around wheel
      ↓
Assign Green / Yellow / Red materials
```

Similarly:

```text
1 Spoke
      ↓
Radial duplication
      ↓
Complete wheel structure
```

---

# 12. Color Specification

Use visually clear traffic-light colors:

```text
GREEN  → Normal / On-Time
YELLOW → Small Delay
RED    → High Delay
```

The colors must be clearly distinguishable even when the Ferris Wheel is viewed from a distance.

Do not introduce additional seat-category colors.

The structural components can use neutral realistic materials such as:

- Metal
- Dark gray
- Silver
- White
- Black
- Neutral theme-park colors

The **green/yellow/red colors are specifically reserved for the passenger cabins/seats**.

---

# 13. Visual Composition

The Ferris Wheel should be presented as the **main and only ride**.

Do not add:

- Roller coaster
- Mini train
- Tea cup
- Crazy wagon
- Pirate ship
- Sky ring
- Rainbow loops
- Other rides
- Other departments
- Other attractions

For this task, focus exclusively on:

# FERRIS WHEEL

---

# 14. Theme Park Integration

Although only the Ferris Wheel should be created now, the model should be designed so that it can later be placed inside the employee theme park.

Keep the ride as a self-contained asset.

Recommended hierarchy:

```text
Ferris_Wheel
│
├── Wheel
│   ├── Outer_Rim
│   ├── Inner_Rim
│   ├── Hub
│   └── Spokes
│
├── Supports
│   ├── Left_Support
│   ├── Right_Support
│   └── Base
│
├── Cabins
│   ├── Green_Cabins
│   ├── Yellow_Cabins
│   └── Red_Cabins
│
└── Mechanical
    ├── Cabin_Pivots
    └── Rotation_System
```

---

# 15. Seat Distribution

Use exactly 60 cabins:

```text
Green  = 20
Yellow = 20
Red    = 20

TOTAL  = 60
```

Distribute them around the wheel in a balanced pattern.

Example pattern:

```text
Green → Yellow → Red → Green → Yellow → Red
```

Repeat the pattern around the wheel while maintaining equal spacing.

The final result should visually show a balanced mixture of the three colors.

---

# 16. Scale and Proportions

Prioritize the reference model's proportions.

Match as closely as possible:

- Wheel diameter
- Wheel thickness
- Cabin size
- Cabin spacing
- Support height
- Hub size
- Spoke proportions
- Cabin-to-wheel ratio
- Overall height-to-width ratio

Do not make the cabins disproportionately large or small.

The 60-seat requirement should be achieved through **efficient and believable spacing**, not by making the cabins unrealistically tiny.

---

# 17. Camera / Presentation

Provide a professional presentation view showing the complete Ferris Wheel.

Preferred views:

### Main View

A three-quarter perspective showing:

- Entire wheel
- Both supports
- Hub
- Spokes
- Most/all cabins
- Green/yellow/red distribution

### Secondary View

A front view showing:

- Symmetry
- Cabin distribution
- Wheel structure

### Optional Detail View

Show:

- Cabin
- Suspension
- Wheel rim
- Mechanical connection

---

# 18. Final Validation Checklist

Before considering the Ferris Wheel complete, verify:

- [ ] Only Ferris Wheel is created
- [ ] Exactly 60 cabins exist
- [ ] 20 green cabins exist
- [ ] 20 yellow cabins exist
- [ ] 20 red cabins exist
- [ ] Cabins are evenly distributed
- [ ] Wheel has realistic proportions
- [ ] Central hub is present
- [ ] Spokes are structurally connected
- [ ] Support structure is present
- [ ] Wheel rotates around the correct axis
- [ ] Cabins remain upright during rotation
- [ ] Cabin pivots behave realistically
- [ ] No cabin intersects the wheel
- [ ] No floating components
- [ ] Model has realistic materials
- [ ] Model is visually close to the supplied reference
- [ ] Model is suitable for later theme-park integration
- [ ] Sketchfab license was checked before any direct asset reuse
- [ ] Attribution is provided if required
- [ ] If reuse is not permitted, the model is recreated independently in Blender

---

# 19. Success Criteria

The final Ferris Wheel should immediately look like the **same type of Ferris Wheel shown in the supplied Sketchfab reference**, with approximately **95% similarity in overall visual impression, proportions, mechanical structure, cabin arrangement, and realism**, while being adapted to this project's unique:

**60-seat + Green/Yellow/Red employee-status concept.**

Do not spend effort creating the rest of the theme park.

**Build only the Ferris Wheel.**