-- ============================================================================
-- Seed: Drawing & Fitness Courses and Lessons
-- ============================================================================

-- =============================================================================
-- DRAWING — 3 Courses
-- =============================================================================

INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d3000000-0000-0000-0000-000000000001', 'b31dbc01-7892-4f63-9697-84b05546f595',
   'Foundations of Drawing',
   'Core skills every artist needs — line quality, shape construction, value, and proportion. Build the foundation for everything else.',
   'beginner', 'Fundamentals', 1, 4, true),

  ('d3000000-0000-0000-0000-000000000002', 'b31dbc01-7892-4f63-9697-84b05546f595',
   'Light, Shadow & Form',
   'Transform flat shapes into three-dimensional forms. Master value scales, cast shadows, and rendering techniques.',
   'intermediate', 'Rendering', 2, 4, true),

  ('d3000000-0000-0000-0000-000000000003', 'b31dbc01-7892-4f63-9697-84b05546f595',
   'Figure Drawing Essentials',
   'Draw the human figure with confidence — gesture, proportion, anatomy landmarks, and expressive poses.',
   'intermediate', 'Figure Drawing', 3, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_count = EXCLUDED.lesson_count, published = EXCLUDED.published, updated_at = now();

-- =============================================================================
-- FITNESS — 3 Courses
-- =============================================================================

INSERT INTO betterat_courses (id, interest_id, title, description, level, topic, sort_order, lesson_count, published)
VALUES
  ('d4000000-0000-0000-0000-000000000001', 'f138e519-7ac9-4497-a0ee-fba242482bce',
   'Training Science Fundamentals',
   'The science behind effective training — progressive overload, specificity, recovery, and program design principles.',
   'beginner', 'Principles', 1, 4, true),

  ('d4000000-0000-0000-0000-000000000002', 'f138e519-7ac9-4497-a0ee-fba242482bce',
   'Strength Training Fundamentals',
   'Master the big lifts — squat, deadlift, bench press, and overhead press with proper technique.',
   'beginner', 'Technique', 2, 4, true),

  ('d4000000-0000-0000-0000-000000000003', 'f138e519-7ac9-4497-a0ee-fba242482bce',
   'Recovery & Performance',
   'Optimize recovery through sleep, nutrition, mobility, and smart progress tracking to sustain long-term gains.',
   'intermediate', 'Recovery', 3, 4, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_count = EXCLUDED.lesson_count, published = EXCLUDED.published, updated_at = now();

-- =============================================================================
-- DRAWING — 12 Lessons
-- =============================================================================

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES
  -- Course 1: Foundations of Drawing
  ('d3100000-0000-0000-0000-000000000001', 'd3000000-0000-0000-0000-000000000001',
   'Line Quality & Control',
   'Develop confident, expressive lines. Practice contour, gesture, and weighted line techniques.',
   '{"lessonId": "drawing-1-1", "steps": [
     {"stepNumber": 1, "label": "Warm-Up Lines", "description": "Fill a page with confident, shoulder-driven strokes.", "details": ["Draw from the shoulder, not the wrist", "Long parallel lines across the full page", "Circles and ellipses at various sizes", "Ghost the line before committing"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Contour Drawing", "description": "Trace the outer edges of an object without lifting your pencil.", "details": ["Pure contour: eyes on subject, not paper", "Modified contour: occasional glances at paper", "Slow, deliberate observation", "Captures the essence of form"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Line Weight Variation", "description": "Use thick and thin lines to create depth and emphasis.", "details": ["Thick lines: shadow side, foreground, overlapping edges", "Thin lines: light side, background, turning edges", "Consistent pressure control", "Practice: draw a simple object using only line weight to show form"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 1, true),

  ('d3100000-0000-0000-0000-000000000002', 'd3000000-0000-0000-0000-000000000001',
   'Shape Construction',
   'Break any complex form into simple geometric shapes. The foundation of structural drawing.',
   '{"lessonId": "drawing-1-2", "steps": [
     {"stepNumber": 1, "label": "Basic Shapes", "description": "Practice drawing circles, squares, triangles, and ellipses freehand.", "details": ["Every complex form is built from simple shapes", "Cube, sphere, cylinder, cone — the 4 building blocks", "Practice rotating shapes in perspective"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Shape Decomposition", "description": "Analyze complex objects by breaking them into simple shape components.", "details": ["A coffee mug = cylinder + handle (bent cylinder)", "A face = sphere (cranium) + cylinder (neck) + wedge (nose)", "Draw the construction lines, then refine"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Constructive Drawing", "description": "Build up a complex subject from shapes to refined drawing.", "details": ["Start with largest shapes first", "Add medium shapes to subdivide", "Refine edges and details last", "Construction lines should remain light"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 2, true),

  ('d3100000-0000-0000-0000-000000000003', 'd3000000-0000-0000-0000-000000000001',
   'Value & Tone',
   'Create a full value range from white to black. Understand how value creates the illusion of light.',
   '{"lessonId": "drawing-1-3", "steps": [
     {"stepNumber": 1, "label": "Value Scale", "description": "Create a 9-step value scale from white to black.", "details": ["Even gradation between each step", "Squint to check value accuracy", "Practice with pencil, charcoal, and pen"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Hatching Techniques", "description": "Build tone through parallel lines, crosshatching, and stippling.", "details": ["Hatching: parallel lines, closer = darker", "Crosshatching: overlapping line directions", "Stippling: dots, denser = darker", "Blending: smooth tonal transitions"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Value Study", "description": "Draw a simple still life using only 5 values.", "details": ["Squint to simplify values", "Block in large value shapes first", "Darkest dark and lightest light establish the range", "Everything else is relative to those anchors"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 3, true),

  ('d3100000-0000-0000-0000-000000000004', 'd3000000-0000-0000-0000-000000000001',
   'Proportion & Measurement',
   'Accurate proportions through sight-sizing, comparative measurement, and the plumb line technique.',
   '{"lessonId": "drawing-1-4", "steps": [
     {"stepNumber": 1, "label": "Sight-Sizing", "description": "Use your pencil as a measuring tool to compare proportions.", "details": ["Arm fully extended, one eye closed", "Use pencil length to measure and compare", "Width-to-height ratios", "Negative space as measurement check"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Comparative Measurement", "description": "Use one part of the subject as a unit to measure everything else.", "details": ["Head height as unit for figure proportions", "Eye width as unit for facial features", "Transfer ratios to your drawing", "Cross-check: does it look right when you step back?"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Plumb Lines & Angles", "description": "Use vertical and horizontal reference lines to check alignment.", "details": ["Hold pencil vertically to check alignments", "What is directly above/below what?", "Check angles by holding pencil along an edge", "Transfer angles to your drawing"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 4, true),

  -- Course 2: Light, Shadow & Form
  ('d3100000-0000-0000-0000-000000000005', 'd3000000-0000-0000-0000-000000000002',
   'Understanding Light Sources',
   'How light direction, quality, and intensity affect what you see and draw.',
   '{"lessonId": "drawing-2-1", "steps": [
     {"stepNumber": 1, "label": "Light Direction", "description": "Identify how light direction determines where shadows fall.", "details": ["Direct light: strong shadows, high contrast", "Diffuse light: soft shadows, low contrast", "Backlight: silhouette effect, rim lighting", "Multiple sources: overlapping shadows"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Light on Form", "description": "Map the zones of light on a sphere to understand 3D rendering.", "details": ["Highlight: brightest point where light hits directly", "Halftone: gradual transition from light to shadow", "Core shadow: darkest area on the form (shadow side)", "Reflected light: bounce light within shadow", "Cast shadow: shadow projected onto another surface"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Light Study", "description": "Draw a single egg or sphere under a strong directional light.", "details": ["Set up a simple still life with one light source", "Identify each zone of light before drawing", "Render all value zones", "Compare to reference throughout"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 1, true),

  ('d3100000-0000-0000-0000-000000000006', 'd3000000-0000-0000-0000-000000000002',
   'Cast Shadows & Edges',
   'Draw convincing cast shadows and master hard, soft, and lost edges.',
   '{"lessonId": "drawing-2-2", "steps": [
     {"stepNumber": 1, "label": "Cast Shadow Construction", "description": "Construct cast shadows based on light source position.", "details": ["Shadow follows light rays through object edges to surface", "Near light: shorter, sharper shadows", "Far light: longer, softer shadows", "Shadow edge softens further from object"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Edge Quality", "description": "Control hard, soft, firm, and lost edges to create depth.", "details": ["Hard edge: sharp contrast, foreground, focal point", "Soft edge: gradual transition, background, turning form", "Firm edge: clear but not razor-sharp", "Lost edge: boundary disappears into similar value — creates mystery"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 2, true),

  ('d3100000-0000-0000-0000-000000000007', 'd3000000-0000-0000-0000-000000000002',
   'Rendering Geometric Forms',
   'Apply light and shadow principles to cubes, cylinders, and cones.',
   '{"lessonId": "drawing-2-3", "steps": [
     {"stepNumber": 1, "label": "Rendering a Cube", "description": "Draw a cube showing three distinct value planes.", "details": ["Top plane: lightest (closest to overhead light)", "Side plane facing light: medium value", "Side plane away from light: darkest", "Each plane is a flat value — no gradation within plane", "Cast shadow projects from base"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Rendering a Cylinder", "description": "Smooth value gradation around a curved form.", "details": ["Core shadow band wraps around the form", "Gradual halftone transition from light to shadow", "Reflected light on shadow side (lighter than core shadow but darker than halftones)", "Elliptical top and bottom"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Combined Forms", "description": "Draw a still life that combines geometric forms.", "details": ["Arrange 3-4 objects under single light source", "Identify all shadow zones for each object", "Objects cast shadows on each other (occlusion shadows)", "Background value affects perceived form values"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 3, true),

  ('d3100000-0000-0000-0000-000000000008', 'd3000000-0000-0000-0000-000000000002',
   'Materials & Mark-Making',
   'Explore graphite, charcoal, and ink. Each medium offers different expressive possibilities.',
   '{"lessonId": "drawing-2-4", "steps": [
     {"stepNumber": 1, "label": "Graphite Range", "description": "Understand the H-B scale and which pencils to use for what.", "details": ["H pencils: hard, light, precise lines", "B pencils: soft, dark, expressive marks", "HB/2B: general purpose", "6B-9B: rich darks, gesture work", "Mechanical vs woodcase: precision vs expression"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Charcoal", "description": "Explore vine, compressed, and charcoal pencil.", "details": ["Vine charcoal: light, erasable, great for blocking in", "Compressed: dense, dark, harder to erase", "White charcoal: highlights on toned paper", "Blending tools: chamois, paper stump, fingers"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Ink", "description": "Permanent mark-making with pen and brush.", "details": ["Technical pen: consistent line weight", "Dip pen: variable line through pressure", "Brush pen: most expressive range", "Ink wash: diluted ink for tonal values", "Embrace happy accidents — ink rewards confidence"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 4, true),

  -- Course 3: Figure Drawing Essentials
  ('d3100000-0000-0000-0000-000000000009', 'd3000000-0000-0000-0000-000000000003',
   'Gesture Drawing',
   'Capture the energy and movement of a pose in 30 seconds to 2 minutes. Speed builds intuition.',
   '{"lessonId": "drawing-3-1", "steps": [
     {"stepNumber": 1, "label": "Line of Action", "description": "Find the single sweeping line that captures the pose energy.", "details": ["One line from head through torso", "Captures the thrust, lean, or twist", "Curved lines create more dynamic poses", "This is the skeleton of your gesture"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "30-Second Gestures", "description": "Rapid poses that force you to capture only the essential.", "details": ["No details — only movement and proportion", "Work large, use whole arm", "Overlapping C and S curves", "Fill entire pages — quantity builds skill"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "2-Minute Gestures", "description": "Add mass and weight to the gesture foundation.", "details": ["Start with line of action (5 seconds)", "Add ribcage and pelvis as simple shapes (15 seconds)", "Connect with spine curve", "Add limbs as tapered forms", "Indicate head and weight-bearing foot"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 1, true),

  ('d3100000-0000-0000-0000-000000000010', 'd3000000-0000-0000-0000-000000000003',
   'Figure Proportions',
   'The canonical proportions of the human figure — head heights, landmarks, and common mistakes.',
   '{"lessonId": "drawing-3-2", "steps": [
     {"stepNumber": 1, "label": "Head-Height System", "description": "Use head height as the unit of measurement for the entire figure.", "details": ["Idealized figure: 7.5-8 heads tall", "Chin to nipples: 1 head", "Nipples to navel: 1 head", "Navel to crotch: 1 head", "Crotch to mid-knee: 2 heads (legs are half the body)"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Landmark Alignment", "description": "Key anatomical landmarks that help verify proportions.", "details": ["Shoulders: ~2 head widths (male), ~1.5 (female)", "Elbows align with navel/waist", "Wrists align with crotch", "Fingertips reach mid-thigh", "Foot is approximately 1 head length"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Proportion Practice", "description": "Draw a standing figure using the head-height method.", "details": ["Measure and mark 8 head-height divisions", "Block in major landmarks at correct positions", "Build figure around landmarks", "Step back and check proportions from distance"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 2, true),

  ('d3100000-0000-0000-0000-000000000011', 'd3000000-0000-0000-0000-000000000003',
   'Anatomy for Artists',
   'Key muscle groups and skeletal landmarks that create surface form. What you need to know, not medical detail.',
   '{"lessonId": "drawing-3-3", "steps": [
     {"stepNumber": 1, "label": "The Torso", "description": "Ribcage and pelvis as the two main masses, connected by the flexible spine.", "details": ["Ribcage: egg shape, tilts and twists", "Pelvis: bowl shape, counterbalances ribcage", "Contrapposto: when one tilts, the other compensates", "Major muscles: pectorals, deltoids, external obliques, rectus abdominis"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Arms & Legs", "description": "Understand limbs as overlapping, tapered cylinders.", "details": ["Upper arm: deltoid wraps over, bicep/tricep oppose", "Forearm: wider near elbow, tapers to wrist", "Thigh: quadriceps in front, hamstrings behind", "Lower leg: calf bulge higher on inside, lower on outside", "Key: inside ankle higher than outside ankle"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Anatomical Drawing", "description": "Draw a figure with visible anatomical landmarks.", "details": ["Start with gesture and proportion", "Add major muscle groups as simple shapes", "Surface form follows underlying anatomy", "Bony landmarks: clavicle, scapula, iliac crest, patella"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 3, true),

  ('d3100000-0000-0000-0000-000000000012', 'd3000000-0000-0000-0000-000000000003',
   'Expressive Poses & Composition',
   'Move beyond stiff poses. Capture emotion, narrative, and dynamic composition in figure work.',
   '{"lessonId": "drawing-3-4", "steps": [
     {"stepNumber": 1, "label": "Dynamic Balance", "description": "Create believable weight distribution in active poses.", "details": ["Center of gravity: plumb line from head to weight-bearing foot", "Contrapposto: weight on one leg shifts everything", "Action poses: center of gravity shifts outside base of support", "Leaning, reaching, twisting — follow the weight"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Foreshortening", "description": "Draw limbs and forms coming toward or away from the viewer.", "details": ["Forms appear shorter when angled toward viewer", "Overlap is the key to convincing foreshortening", "Draw what you see, not what you know", "Practice: draw your own hand in various foreshortened positions"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Composition", "description": "Place the figure within the page for maximum impact.", "details": ["Dont center the figure — use asymmetry", "Leave room in the direction the figure is looking/moving", "Crop deliberately — partial figures can be more powerful", "Vary scale: some drawings fill the page, some are small studies"], "action": "PERFORM"}
   ]}'::jsonb, 'drawing-exercise', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data, interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order, published = EXCLUDED.published, updated_at = now();

-- =============================================================================
-- FITNESS — 12 Lessons
-- =============================================================================

INSERT INTO betterat_lessons (id, course_id, title, description, lesson_data, interactive_type, sort_order, published)
VALUES
  -- Course 1: Training Science Fundamentals
  ('d4100000-0000-0000-0000-000000000001', 'd4000000-0000-0000-0000-000000000001',
   'Understanding Training Principles',
   'The science behind why training works — progressive overload, specificity, recovery, and adaptation.',
   '{"lessonId": "fitness-1-1", "steps": [
     {"stepNumber": 1, "label": "Progressive Overload", "description": "Gradually increase training stress to force adaptation.", "details": ["Increase weight, reps, sets, or decrease rest", "The body adapts to what you repeatedly demand of it", "Too much too fast = injury; too little = plateau", "Track your lifts to ensure progression"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Specificity (SAID)", "description": "Your body adapts specifically to the demands you place on it.", "details": ["SAID: Specific Adaptation to Imposed Demands", "Want to get better at squats? Squat", "Cardio adaptations dont transfer to strength and vice versa", "Sport-specific training mimics competition demands"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Recovery & Supercompensation", "description": "Training tears you down. Recovery builds you up stronger.", "details": ["Training stimulus causes fatigue and micro-damage", "Recovery period: body repairs and adapts (supercompensation)", "Train again at the peak of supercompensation", "Inadequate recovery = overtraining, declining performance", "Sleep, nutrition, and stress management are part of training"], "action": "OBSERVE"}
   ]}'::jsonb, 'training-concept', 1, true),

  ('d4100000-0000-0000-0000-000000000002', 'd4000000-0000-0000-0000-000000000001',
   'Movement Patterns & Exercise Selection',
   'The 7 fundamental human movement patterns and how to build a balanced training program around them.',
   '{"lessonId": "fitness-1-2", "steps": [
     {"stepNumber": 1, "label": "Push & Pull", "description": "Horizontal and vertical pushing and pulling movements.", "details": ["Horizontal push: bench press, push-up", "Horizontal pull: barbell row, dumbbell row", "Vertical push: overhead press, handstand push-up", "Vertical pull: pull-up, lat pulldown", "Balance push and pull volume for shoulder health"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Squat & Hinge", "description": "Knee-dominant and hip-dominant lower body patterns.", "details": ["Squat: back squat, front squat, goblet squat", "Hinge: deadlift, Romanian deadlift, hip thrust", "Squat = quad emphasis; Hinge = posterior chain emphasis", "Both are essential — dont skip either"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Carry, Lunge & Rotate", "description": "Loaded carries, single-leg work, and rotational training.", "details": ["Carry: farmers walk, suitcase carry — total body stability", "Lunge: walking lunge, Bulgarian split squat — single leg strength", "Rotate: cable woodchop, medicine ball throw — athletic power", "These patterns transfer most directly to daily life and sport"], "action": "OBSERVE"}
   ]}'::jsonb, 'training-concept', 2, true),

  ('d4100000-0000-0000-0000-000000000003', 'd4000000-0000-0000-0000-000000000001',
   'Program Design Basics',
   'Build your own training program — sets, reps, frequency, and periodization fundamentals.',
   '{"lessonId": "fitness-1-3", "steps": [
     {"stepNumber": 1, "label": "Rep Ranges & Goals", "description": "Match rep ranges to your primary training goal.", "details": ["Strength: 1-5 reps, heavy weight, long rest (3-5 min)", "Hypertrophy: 6-12 reps, moderate weight, moderate rest (60-90 sec)", "Endurance: 15+ reps, light weight, short rest (30-60 sec)", "Most people benefit from training across all ranges"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Weekly Structure", "description": "Organize training across the week for balance and recovery.", "details": ["Full body: 3x/week, good for beginners", "Upper/Lower: 4x/week, moderate frequency", "Push/Pull/Legs: 6x/week, high volume", "Each muscle group: minimum 2x/week for growth", "At least 48 hours between same muscle group"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Periodization", "description": "Plan training in cycles to manage fatigue and peak performance.", "details": ["Microcycle: 1 week", "Mesocycle: 3-6 weeks (training block)", "Macrocycle: 3-12 months (season or goal)", "Deload: planned light week every 4-6 weeks", "Progressive overload within blocks, deload between"], "action": "OBSERVE"}
   ]}'::jsonb, 'training-concept', 3, true),

  ('d4100000-0000-0000-0000-000000000004', 'd4000000-0000-0000-0000-000000000001',
   'Warm-Up & Cool-Down Protocols',
   'Evidence-based warm-up sequences that prepare you for performance and reduce injury risk.',
   '{"lessonId": "fitness-1-4", "steps": [
     {"stepNumber": 1, "label": "General Warm-Up", "description": "Raise core temperature and increase blood flow.", "details": ["5-10 minutes light cardio: rowing, cycling, jump rope", "Goal: light sweat, elevated heart rate", "Not exhausting — just preparing"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Dynamic Stretching", "description": "Movement-based stretching that prepares joints and muscles.", "details": ["Leg swings, arm circles, hip circles", "Inchworms, worlds greatest stretch", "Sport-specific movements at low intensity", "Static stretching BEFORE training may reduce performance"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Ramp-Up Sets", "description": "Gradually increase weight to working sets.", "details": ["Empty bar or very light: 10-15 reps (movement quality)", "50% working weight: 8 reps", "70% working weight: 5 reps", "85% working weight: 2-3 reps", "Then begin working sets — fully prepared"], "action": "PERFORM"}
   ]}'::jsonb, 'training-concept', 4, true),

  -- Course 2: Strength Training Fundamentals
  ('d4100000-0000-0000-0000-000000000005', 'd4000000-0000-0000-0000-000000000002',
   'The Squat',
   'Complete squat technique — setup, descent, bottom position, and drive. Troubleshoot common faults.',
   '{"lessonId": "fitness-2-1", "steps": [
     {"stepNumber": 1, "label": "Setup", "description": "Bar position, grip, and stance for a safe, strong squat.", "details": ["High bar: on upper traps, more upright torso", "Low bar: on rear delts, more forward lean", "Grip: as narrow as comfortable, elbows pulled down", "Stance: shoulder width or slightly wider, toes slightly out", "Brace: big breath into belly, tighten core before unracking"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Descent", "description": "Control the eccentric phase with proper mechanics.", "details": ["Break at hips and knees simultaneously", "Knees track over toes (its OK for knees to pass toes)", "Keep chest up and back tight", "Controlled speed — not dropping", "Depth: hip crease at or below knee (parallel or deeper)"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Drive & Lockout", "description": "Power out of the hole and complete the rep.", "details": ["Drive through whole foot (not just heels)", "Hips and shoulders rise at same rate", "Knees push out, not caving in (valgus)", "Full lockout: hips extended, standing tall", "Re-brace for next rep"], "action": "PERFORM"}
   ]}'::jsonb, 'exercise-technique', 1, true),

  ('d4100000-0000-0000-0000-000000000006', 'd4000000-0000-0000-0000-000000000002',
   'The Deadlift',
   'Conventional and sumo deadlift technique. The most functional strength exercise you can do.',
   '{"lessonId": "fitness-2-2", "steps": [
     {"stepNumber": 1, "label": "Setup", "description": "Position for a strong, safe pull from the floor.", "details": ["Bar over mid-foot (about 1 inch from shins)", "Feet hip-width (conventional) or wide (sumo)", "Grip just outside knees, double overhand or mixed", "Hips higher than knees, shoulders over or slightly in front of bar", "Lats engaged: protect your armpits, push chest through"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "The Pull", "description": "Lift the bar by driving through the floor.", "details": ["Push the floor away (leg drive first)", "Bar stays in contact with legs throughout", "Back angle doesnt change until bar passes knees", "Then hip extension drives you to lockout", "Lockout: stand tall, squeeze glutes, dont hyperextend"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Common Faults", "description": "Identify and correct the most common deadlift errors.", "details": ["Rounding lower back: strengthen back, reduce weight, improve bracing", "Hips shooting up: strengthen quads, practice tempo deadlifts", "Bar drifting forward: keep lats tight, bar on legs", "Hitching (using thighs to push bar up): illegal in competition, practice hip drive", "Mixed grip imbalance: alternate which hand supinates"], "action": "VERIFY"}
   ]}'::jsonb, 'exercise-technique', 2, true),

  ('d4100000-0000-0000-0000-000000000007', 'd4000000-0000-0000-0000-000000000002',
   'The Bench Press',
   'Full bench press technique from setup through lockout. Shoulder-safe pressing mechanics.',
   '{"lessonId": "fitness-2-3", "steps": [
     {"stepNumber": 1, "label": "Setup", "description": "Create a stable base for powerful pressing.", "details": ["Eyes under bar when lying down", "Retract and depress scapulae (squeeze shoulder blades together and down)", "Slight arch: maintains natural spine curve, protects shoulders", "Feet flat on floor, driving into ground", "Grip: slightly wider than shoulder width"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Descent & Press", "description": "Lower with control, press with power.", "details": ["Unrack with locked arms, position bar over shoulders", "Lower to lower chest/sternum area (not neck)", "Elbows at ~45-75 degree angle (not flared at 90)", "Touch chest gently — no bouncing", "Press back up and slightly toward face (J-curve path)", "Lock out over shoulders"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Safety", "description": "How to bench safely — with and without a spotter.", "details": ["Always use clips in a commercial gym", "Without spotter: use safety pins or arms in power rack", "The roll of shame: tilt bar to one side if stuck", "Spotter cues: Liftoff, Spot me at [number], I got it", "Never train to failure alone without safeties"], "action": "VERIFY"}
   ]}'::jsonb, 'exercise-technique', 3, true),

  ('d4100000-0000-0000-0000-000000000008', 'd4000000-0000-0000-0000-000000000002',
   'The Overhead Press',
   'Standing barbell press — the true test of upper body strength. Strict technique for shoulder health.',
   '{"lessonId": "fitness-2-4", "steps": [
     {"stepNumber": 1, "label": "Setup & Rack Position", "description": "Start position for a strong overhead press.", "details": ["Bar on front delts and clavicle (front rack)", "Grip just outside shoulder width", "Elbows slightly in front of bar", "Feet hip-width, whole body tight", "Big breath and brace before pressing"], "action": "PERFORM"},
     {"stepNumber": 2, "label": "Press & Lockout", "description": "Move the bar efficiently from shoulders to overhead.", "details": ["Press bar straight up — head moves back slightly to clear face", "Once bar passes forehead, push head through (under the bar)", "Full lockout: bar over mid-foot, arms fully extended", "Shrug slightly at the top for stability", "Lower under control back to front rack"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Troubleshooting", "description": "Fix common overhead press problems.", "details": ["Leaning back excessively: strengthen core, reduce weight", "Pressing forward: head not moving back, then through", "Elbow pain: widen grip slightly, check wrist position", "Stalling at forehead: strengthen at sticking point with pin presses", "This is the slowest lift to progress — small increments are normal"], "action": "VERIFY"}
   ]}'::jsonb, 'exercise-technique', 4, true),

  -- Course 3: Recovery & Performance
  ('d4100000-0000-0000-0000-000000000009', 'd4000000-0000-0000-0000-000000000003',
   'Sleep & Recovery',
   'Sleep is the most powerful recovery tool. Understand sleep architecture and optimize your rest.',
   '{"lessonId": "fitness-3-1", "steps": [
     {"stepNumber": 1, "label": "Sleep Architecture", "description": "How sleep stages affect physical recovery and performance.", "details": ["Stage 1-2: light sleep, transition", "Stage 3 (deep/SWR): growth hormone release, tissue repair, immune function", "REM: cognitive recovery, skill consolidation, emotional processing", "7-9 hours recommended for athletes", "Deep sleep peaks early in the night; REM peaks later"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Sleep Hygiene", "description": "Behavioral strategies to improve sleep quality.", "details": ["Consistent bed/wake times (even weekends)", "Cool room (65-68F / 18-20C)", "Dark room: blackout curtains or sleep mask", "No screens 30-60 min before bed (blue light suppresses melatonin)", "Caffeine cutoff: 8-10 hours before bed", "Alcohol disrupts deep sleep — avoid close to bedtime"], "action": "PERFORM"},
     {"stepNumber": 3, "label": "Napping Strategy", "description": "Use naps to supplement recovery without disrupting nighttime sleep.", "details": ["Power nap: 20 minutes, improved alertness", "Full cycle: 90 minutes, includes deep sleep", "Before 2pm to avoid disrupting night sleep", "Post-training nap can accelerate recovery"], "action": "PERFORM"}
   ]}'::jsonb, 'training-concept', 1, true),

  ('d4100000-0000-0000-0000-000000000010', 'd4000000-0000-0000-0000-000000000003',
   'Nutrition for Training',
   'Fuel your training — macronutrients, meal timing, and hydration for performance and recovery.',
   '{"lessonId": "fitness-3-2", "steps": [
     {"stepNumber": 1, "label": "Macronutrients", "description": "Protein, carbs, and fat — what each does for training.", "details": ["Protein: muscle repair and growth (0.7-1g per lb bodyweight)", "Carbohydrates: primary fuel for high-intensity training", "Fat: hormone production, cell function (minimum 0.3g per lb)", "Calorie balance determines weight change; macros determine composition"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Pre & Post Training", "description": "What and when to eat around training sessions.", "details": ["Pre-training (1-3 hrs before): carbs + moderate protein, low fat", "Post-training (within 2 hrs): protein + carbs for recovery", "Protein timing matters less than total daily intake", "Stay hydrated: 0.5-1oz water per lb bodyweight daily"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Hydration", "description": "Water and electrolyte needs for training.", "details": ["Dehydration of 2% bodyweight = measurable performance decline", "Drink before, during, and after training", "Electrolytes matter for sessions >60 minutes or in heat", "Sodium, potassium, magnesium are key electrolytes", "Urine color: pale yellow = well hydrated"], "action": "OBSERVE"}
   ]}'::jsonb, 'training-concept', 2, true),

  ('d4100000-0000-0000-0000-000000000011', 'd4000000-0000-0000-0000-000000000003',
   'Mobility & Flexibility',
   'Improve range of motion to move better and train harder. Targeted mobility for common restrictions.',
   '{"lessonId": "fitness-3-3", "steps": [
     {"stepNumber": 1, "label": "Mobility vs Flexibility", "description": "Understand the difference and why both matter.", "details": ["Flexibility: passive range of motion (how far you can be stretched)", "Mobility: active range of motion (how far you can move under control)", "Mobility is more useful for training — strength through full ROM", "Tight muscles are often weak muscles"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Common Restrictions", "description": "Address the most common mobility limitations for lifters.", "details": ["Hip flexors: from sitting all day, limits squat and deadlift", "Thoracic spine: rounds upper back, limits overhead pressing", "Ankles: limits squat depth, causes compensation", "Shoulders: limits overhead position and bench press safety"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Mobility Routine", "description": "A 10-minute daily mobility routine targeting common restrictions.", "details": ["90/90 hip stretch: 30 sec each side", "Couch stretch (hip flexor): 30 sec each side", "Cat-cow: 10 reps (thoracic mobility)", "Wall slides: 10 reps (shoulder mobility)", "Ankle dorsiflexion stretch: 30 sec each side", "Do daily, or at minimum before training sessions"], "action": "PERFORM"}
   ]}'::jsonb, 'training-concept', 3, true),

  ('d4100000-0000-0000-0000-000000000012', 'd4000000-0000-0000-0000-000000000003',
   'Tracking Progress & Avoiding Plateaus',
   'What to track, how to track it, and what to do when progress stalls.',
   '{"lessonId": "fitness-3-4", "steps": [
     {"stepNumber": 1, "label": "What to Track", "description": "Key metrics for measuring training progress.", "details": ["Training log: exercises, weight, sets, reps, RPE", "Body measurements: weight (weekly avg), photos (monthly), measurements", "Performance benchmarks: 1RM or rep maxes on key lifts", "Recovery indicators: sleep quality, energy, soreness, motivation", "Dont track everything — pick 3-4 key metrics"], "action": "OBSERVE"},
     {"stepNumber": 2, "label": "Identifying Plateaus", "description": "Know when youre truly stuck vs normal variation.", "details": ["True plateau: no progress for 3+ weeks despite consistency", "Normal variation: daily fluctuations in weight, strength, energy", "Fatigue masking fitness: deload and retest before assuming plateau", "Track trends over weeks, not individual sessions"], "action": "OBSERVE"},
     {"stepNumber": 3, "label": "Breaking Through", "description": "Strategies for overcoming training plateaus.", "details": ["Change the stimulus: new rep range, exercise variation, tempo", "Address the weak link: where does the lift fail?", "Eat more: undereating is the most common plateau cause", "Sleep more: recovery is limiting factor", "Deload: take a planned easy week then push again", "Be patient: progress slows over time — this is normal"], "action": "VERIFY"}
   ]}'::jsonb, 'training-concept', 4, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  lesson_data = EXCLUDED.lesson_data, interactive_type = EXCLUDED.interactive_type,
  sort_order = EXCLUDED.sort_order, published = EXCLUDED.published, updated_at = now();
