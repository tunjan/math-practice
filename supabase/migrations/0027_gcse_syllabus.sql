-- ============================================================================
-- 0027 — Cambridge IGCSE Mathematics (0580) syllabus reference data
--
-- Adds the 9 strands and 71 subtopics for Cambridge IGCSE Mathematics (0580):
-- 53 Core topics (available to both Core and Extended tiers) and 18 Extended
-- topics (available only to Extended).
-- ============================================================================

insert into public.syllabus_topics (course, level, topic, subtopic, code, title) values
  -- Topic 1: Number
  ('0580', 'Core', 1, 1, '1.1', 'Types of number'),
  ('0580', 'Core', 1, 2, '1.2', 'Sets and Venn diagrams'),
  ('0580', 'Core', 1, 3, '1.3', 'Powers and roots'),
  ('0580', 'Core', 1, 4, '1.4', 'Fractions, decimals and percentages'),
  ('0580', 'Core', 1, 5, '1.5', 'Ordering and inequalities'),
  ('0580', 'Core', 1, 6, '1.6', 'The four operations'),
  ('0580', 'Core', 1, 7, '1.7', 'Indices I'),
  ('0580', 'Core', 1, 8, '1.8', 'Standard form'),
  ('0580', 'Core', 1, 9, '1.9', 'Estimation and rounding'),
  ('0580', 'Core', 1, 10, '1.10', 'Limits of accuracy'),
  ('0580', 'Core', 1, 11, '1.11', 'Ratio and proportion'),
  ('0580', 'Core', 1, 12, '1.12', 'Rates and compound measures'),
  ('0580', 'Core', 1, 13, '1.13', 'Percentages and financial maths'),
  ('0580', 'Core', 1, 14, '1.14', 'Using a calculator'),
  ('0580', 'Core', 1, 15, '1.15', 'Time and timetables'),
  ('0580', 'Core', 1, 16, '1.16', 'Money and currency conversion'),
  ('0580', 'Extended', 1, 17, '1.17', 'Exponential growth and decay'),

  -- Topic 2: Algebra and graphs
  ('0580', 'Core', 2, 1, '2.1', 'Introduction to algebra'),
  ('0580', 'Core', 2, 2, '2.2', 'Algebraic manipulation'),
  ('0580', 'Extended', 2, 3, '2.3', 'Algebraic fractions'),
  ('0580', 'Core', 2, 4, '2.4', 'Indices II'),
  ('0580', 'Core', 2, 5, '2.5', 'Equations and rearranging formulae'),
  ('0580', 'Core', 2, 6, '2.6', 'Linear inequalities'),
  ('0580', 'Core', 2, 7, '2.7', 'Sequences and nth term'),
  ('0580', 'Extended', 2, 8, '2.8', 'Direct and inverse proportion'),
  ('0580', 'Core', 2, 9, '2.9', 'Graphs in practical situations'),
  ('0580', 'Core', 2, 10, '2.10', 'Graphs of functions'),
  ('0580', 'Core', 2, 11, '2.11', 'Sketching curves'),
  ('0580', 'Extended', 2, 12, '2.12', 'Differentiation and gradients'),
  ('0580', 'Extended', 2, 13, '2.13', 'Functions and inverse functions'),

  -- Topic 3: Coordinate geometry
  ('0580', 'Core', 3, 1, '3.1', 'Coordinates in two dimensions'),
  ('0580', 'Core', 3, 2, '3.2', 'Drawing linear graphs'),
  ('0580', 'Core', 3, 3, '3.3', 'Gradient of linear graphs'),
  ('0580', 'Extended', 3, 4, '3.4', 'Length and midpoint of a line segment'),
  ('0580', 'Core', 3, 5, '3.5', 'Equations of linear graphs'),
  ('0580', 'Core', 3, 6, '3.6', 'Parallel lines'),
  ('0580', 'Extended', 3, 7, '3.7', 'Perpendicular lines'),

  -- Topic 4: Geometry
  ('0580', 'Core', 4, 1, '4.1', 'Geometrical terms and vocabulary'),
  ('0580', 'Core', 4, 2, '4.2', 'Geometrical constructions'),
  ('0580', 'Core', 4, 3, '4.3', 'Scale drawings and bearings'),
  ('0580', 'Core', 4, 4, '4.4', 'Similarity and congruence'),
  ('0580', 'Core', 4, 5, '4.5', 'Symmetry in 2D and 3D'),
  ('0580', 'Core', 4, 6, '4.6', 'Angles and angle properties'),
  ('0580', 'Core', 4, 7, '4.7', 'Circle theorems I'),
  ('0580', 'Extended', 4, 8, '4.8', 'Circle theorems II'),

  -- Topic 5: Mensuration
  ('0580', 'Core', 5, 1, '5.1', 'Units of measure and conversions'),
  ('0580', 'Core', 5, 2, '5.2', 'Perimeter and area of 2D shapes'),
  ('0580', 'Core', 5, 3, '5.3', 'Circles, arcs and sectors'),
  ('0580', 'Core', 5, 4, '5.4', 'Surface area and volume of solids'),
  ('0580', 'Core', 5, 5, '5.5', 'Compound shapes'),

  -- Topic 6: Trigonometry
  ('0580', 'Core', 6, 1, '6.1', 'Pythagoras'' theorem'),
  ('0580', 'Core', 6, 2, '6.2', 'Right-angled trigonometry (SOH CAH TOA)'),
  ('0580', 'Extended', 6, 3, '6.3', 'Exact trigonometric values'),
  ('0580', 'Extended', 6, 4, '6.4', 'Trigonometric functions and graphs'),
  ('0580', 'Extended', 6, 5, '6.5', 'Sine rule, cosine rule and triangle area'),
  ('0580', 'Extended', 6, 6, '6.6', '3D trigonometry'),

  -- Topic 7: Transformations and vectors
  ('0580', 'Core', 7, 1, '7.1', 'Transformations: reflection, rotation, translation, enlargement'),
  ('0580', 'Extended', 7, 2, '7.2', 'Vectors in two dimensions'),
  ('0580', 'Extended', 7, 3, '7.3', 'Magnitude of a vector'),
  ('0580', 'Extended', 7, 4, '7.4', 'Vector geometry'),

  -- Topic 8: Probability
  ('0580', 'Core', 8, 1, '8.1', 'Introduction to probability'),
  ('0580', 'Core', 8, 2, '8.2', 'Relative and expected frequencies'),
  ('0580', 'Core', 8, 3, '8.3', 'Probability of combined events'),
  ('0580', 'Extended', 8, 4, '8.4', 'Conditional probability and tree diagrams'),

  -- Topic 9: Statistics
  ('0580', 'Core', 9, 1, '9.1', 'Classifying statistical data'),
  ('0580', 'Core', 9, 2, '9.2', 'Interpreting statistical data'),
  ('0580', 'Core', 9, 3, '9.3', 'Averages and range'),
  ('0580', 'Core', 9, 4, '9.4', 'Statistical charts and stem-and-leaf diagrams'),
  ('0580', 'Core', 9, 5, '9.5', 'Scatter diagrams and correlation'),
  ('0580', 'Extended', 9, 6, '9.6', 'Cumulative frequency diagrams'),
  ('0580', 'Extended', 9, 7, '9.7', 'Histograms with unequal intervals')
on conflict (course, code) do update set
  level = excluded.level,
  topic = excluded.topic,
  subtopic = excluded.subtopic,
  title = excluded.title;
