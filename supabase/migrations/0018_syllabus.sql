-- ============================================================================
-- 0018 — Syllabus reference data and a student's course
--
-- The IB Mathematics subtopics, AA and AI, as fixed reference data. `level` is
-- the syllabus's own split: SL content is taught at both levels, AHL
-- (additional higher level) only at HL. So an SL student's topics are their
-- course's SL rows, and an HL student's are all of them.
--
-- Codes clash across courses (AA 1.1 and AI 1.1 are both scientific notation,
-- but AA 1.6 is proof and AI 1.6 is approximation), so a topic is always
-- identified by its course and code together.
--
-- Each student may have a programme, course and level. All three or none: a
-- student with none simply has no syllabus tracker.
-- ============================================================================

create type public.ib_programme as enum ('ib_dp');
create type public.ib_course as enum ('AA', 'AI');
create type public.ib_level as enum ('SL', 'HL');
create type public.syllabus_level as enum ('SL', 'AHL');

-- ── Topics ──────────────────────────────────────────────────────────────────

create table public.syllabus_topics (
  id        uuid primary key default gen_random_uuid(),
  course    public.ib_course not null,
  level     public.syllabus_level not null,
  topic     smallint not null,
  subtopic  smallint not null,
  code      text not null,
  title     text not null,

  constraint syllabus_topics_topic check (topic between 1 and 5),
  constraint syllabus_topics_code check (code = topic || '.' || subtopic),
  constraint syllabus_topics_course_code unique (course, code)
);

create index syllabus_topics_order_idx on public.syllabus_topics (course, topic, subtopic);

comment on table public.syllabus_topics is
  'IB Mathematics subtopics (first assessment 2021). Reference data, written only by migrations.';
comment on column public.syllabus_topics.level is
  'SL: taught at SL and HL. AHL: additional higher level, HL only.';

insert into public.syllabus_topics (course, level, topic, subtopic, code, title) values
  ('AA', 'SL', 1, 1, '1.1', 'Scientific notation'),
  ('AA', 'SL', 1, 2, '1.2', 'Arithmetic sequences and series'),
  ('AA', 'SL', 1, 3, '1.3', 'Geometric sequences and series'),
  ('AA', 'SL', 1, 4, '1.4', 'Financial applications of geometric sequences'),
  ('AA', 'SL', 1, 5, '1.5', 'Exponents and introduction to logarithms'),
  ('AA', 'SL', 1, 6, '1.6', 'Simple deductive proof'),
  ('AA', 'SL', 1, 7, '1.7', 'Rational exponents and laws of logarithms'),
  ('AA', 'SL', 1, 8, '1.8', 'Infinite geometric series'),
  ('AA', 'SL', 1, 9, '1.9', 'Binomial theorem'),
  ('AA', 'AHL', 1, 10, '1.10', 'Counting principles and extended binomial theorem'),
  ('AA', 'AHL', 1, 11, '1.11', 'Partial fractions'),
  ('AA', 'AHL', 1, 12, '1.12', 'Complex numbers: Cartesian form'),
  ('AA', 'AHL', 1, 13, '1.13', 'Complex numbers: polar and Euler form'),
  ('AA', 'AHL', 1, 14, '1.14', 'Conjugate roots, De Moivre''s theorem and nth roots'),
  ('AA', 'AHL', 1, 15, '1.15', 'Proof by induction and contradiction; counterexamples'),
  ('AA', 'AHL', 1, 16, '1.16', 'Systems of linear equations'),
  ('AA', 'SL', 2, 1, '2.1', 'Equations of straight lines'),
  ('AA', 'SL', 2, 2, '2.2', 'Functions: domain, range and graph'),
  ('AA', 'SL', 2, 3, '2.3', 'Graphing functions'),
  ('AA', 'SL', 2, 4, '2.4', 'Key features of graphs; composite functions'),
  ('AA', 'SL', 2, 5, '2.5', 'Inverse functions'),
  ('AA', 'SL', 2, 6, '2.6', 'Quadratic functions'),
  ('AA', 'SL', 2, 7, '2.7', 'Quadratic equations, discriminant and inequalities'),
  ('AA', 'SL', 2, 8, '2.8', 'Rational functions and the reciprocal function'),
  ('AA', 'SL', 2, 9, '2.9', 'Exponential and logarithmic functions'),
  ('AA', 'SL', 2, 10, '2.10', 'Solving equations graphically and analytically'),
  ('AA', 'SL', 2, 11, '2.11', 'Transformations of graphs'),
  ('AA', 'AHL', 2, 12, '2.12', 'Polynomial functions, factor and remainder theorems'),
  ('AA', 'AHL', 2, 13, '2.13', 'Rational functions and oblique asymptotes'),
  ('AA', 'AHL', 2, 14, '2.14', 'Odd and even functions; self-inverse functions'),
  ('AA', 'AHL', 2, 15, '2.15', 'Solving inequalities'),
  ('AA', 'AHL', 2, 16, '2.16', 'The modulus function'),
  ('AA', 'SL', 3, 1, '3.1', '3D geometry: distance, volume and surface area'),
  ('AA', 'SL', 3, 2, '3.2', 'Sine rule, cosine rule and area of a triangle'),
  ('AA', 'SL', 3, 3, '3.3', 'Applications of trigonometry'),
  ('AA', 'SL', 3, 4, '3.4', 'Radians, arc length and sector area'),
  ('AA', 'SL', 3, 5, '3.5', 'Unit circle and exact values'),
  ('AA', 'SL', 3, 6, '3.6', 'Pythagorean and double angle identities'),
  ('AA', 'SL', 3, 7, '3.7', 'Circular functions and their graphs'),
  ('AA', 'SL', 3, 8, '3.8', 'Solving trigonometric equations'),
  ('AA', 'AHL', 3, 9, '3.9', 'Reciprocal and inverse trigonometric functions'),
  ('AA', 'AHL', 3, 10, '3.10', 'Compound angle identities'),
  ('AA', 'AHL', 3, 11, '3.11', 'Symmetry of trigonometric graphs'),
  ('AA', 'AHL', 3, 12, '3.12', 'Vectors: concepts and operations'),
  ('AA', 'AHL', 3, 13, '3.13', 'Scalar product and angle between vectors'),
  ('AA', 'AHL', 3, 14, '3.14', 'Vector equation of a line'),
  ('AA', 'AHL', 3, 15, '3.15', 'Relationships between lines in 3D'),
  ('AA', 'AHL', 3, 16, '3.16', 'Vector product'),
  ('AA', 'AHL', 3, 17, '3.17', 'Equations of a plane'),
  ('AA', 'AHL', 3, 18, '3.18', 'Intersections and angles of lines and planes'),
  ('AA', 'SL', 4, 1, '4.1', 'Sampling and data'),
  ('AA', 'SL', 4, 2, '4.2', 'Presentation of data'),
  ('AA', 'SL', 4, 3, '4.3', 'Central tendency and dispersion'),
  ('AA', 'SL', 4, 4, '4.4', 'Linear correlation and regression of y on x'),
  ('AA', 'SL', 4, 5, '4.5', 'Probability concepts'),
  ('AA', 'SL', 4, 6, '4.6', 'Combined, conditional and independent events'),
  ('AA', 'SL', 4, 7, '4.7', 'Discrete random variables'),
  ('AA', 'SL', 4, 8, '4.8', 'Binomial distribution'),
  ('AA', 'SL', 4, 9, '4.9', 'Normal distribution'),
  ('AA', 'SL', 4, 10, '4.10', 'Regression of x on y'),
  ('AA', 'SL', 4, 11, '4.11', 'Formal conditional probability'),
  ('AA', 'SL', 4, 12, '4.12', 'Standardisation and inverse normal'),
  ('AA', 'AHL', 4, 13, '4.13', 'Bayes'' theorem'),
  ('AA', 'AHL', 4, 14, '4.14', 'Continuous random variables and variance'),
  ('AA', 'SL', 5, 1, '5.1', 'Limits and the derivative'),
  ('AA', 'SL', 5, 2, '5.2', 'Increasing and decreasing functions'),
  ('AA', 'SL', 5, 3, '5.3', 'Differentiating powers and polynomials'),
  ('AA', 'SL', 5, 4, '5.4', 'Tangents and normals'),
  ('AA', 'SL', 5, 5, '5.5', 'Introduction to integration'),
  ('AA', 'SL', 5, 6, '5.6', 'Derivatives of standard functions; chain, product and quotient rules'),
  ('AA', 'SL', 5, 7, '5.7', 'The second derivative'),
  ('AA', 'SL', 5, 8, '5.8', 'Maxima, minima, optimisation and inflection'),
  ('AA', 'SL', 5, 9, '5.9', 'Kinematics'),
  ('AA', 'SL', 5, 10, '5.10', 'Indefinite integrals and reverse chain rule'),
  ('AA', 'SL', 5, 11, '5.11', 'Definite integrals and areas'),
  ('AA', 'AHL', 5, 12, '5.12', 'Continuity, differentiability and higher derivatives'),
  ('AA', 'AHL', 5, 13, '5.13', 'L''Hôpital''s rule'),
  ('AA', 'AHL', 5, 14, '5.14', 'Implicit differentiation and related rates'),
  ('AA', 'AHL', 5, 15, '5.15', 'Further derivatives and integrals'),
  ('AA', 'AHL', 5, 16, '5.16', 'Integration by substitution and by parts'),
  ('AA', 'AHL', 5, 17, '5.17', 'Areas about the y-axis and volumes of revolution'),
  ('AA', 'AHL', 5, 18, '5.18', 'First-order differential equations'),
  ('AA', 'AHL', 5, 19, '5.19', 'Maclaurin series'),
  ('AI', 'SL', 1, 1, '1.1', 'Scientific notation'),
  ('AI', 'SL', 1, 2, '1.2', 'Arithmetic sequences and series'),
  ('AI', 'SL', 1, 3, '1.3', 'Geometric sequences and series'),
  ('AI', 'SL', 1, 4, '1.4', 'Financial applications of geometric sequences'),
  ('AI', 'SL', 1, 5, '1.5', 'Exponents and introduction to logarithms'),
  ('AI', 'SL', 1, 6, '1.6', 'Approximation, bounds and percentage error'),
  ('AI', 'SL', 1, 7, '1.7', 'Amortisation and annuities'),
  ('AI', 'SL', 1, 8, '1.8', 'Solving systems and polynomial equations with technology'),
  ('AI', 'AHL', 1, 9, '1.9', 'Laws of logarithms'),
  ('AI', 'AHL', 1, 10, '1.10', 'Rational exponents'),
  ('AI', 'AHL', 1, 11, '1.11', 'Infinite geometric series'),
  ('AI', 'AHL', 1, 12, '1.12', 'Complex numbers: Cartesian form'),
  ('AI', 'AHL', 1, 13, '1.13', 'Complex numbers: polar and exponential form'),
  ('AI', 'AHL', 1, 14, '1.14', 'Matrices'),
  ('AI', 'AHL', 1, 15, '1.15', 'Eigenvalues and eigenvectors'),
  ('AI', 'SL', 2, 1, '2.1', 'Equations of straight lines'),
  ('AI', 'SL', 2, 2, '2.2', 'Functions: domain, range and inverse'),
  ('AI', 'SL', 2, 3, '2.3', 'Graphing functions'),
  ('AI', 'SL', 2, 4, '2.4', 'Key features of graphs'),
  ('AI', 'SL', 2, 5, '2.5', 'Modelling with function families'),
  ('AI', 'SL', 2, 6, '2.6', 'The modelling process'),
  ('AI', 'AHL', 2, 7, '2.7', 'Composite and inverse functions'),
  ('AI', 'AHL', 2, 8, '2.8', 'Transformations of graphs'),
  ('AI', 'AHL', 2, 9, '2.9', 'Further models: logistic, logarithmic, piecewise'),
  ('AI', 'AHL', 2, 10, '2.10', 'Logarithmic scales and linearising data'),
  ('AI', 'SL', 3, 1, '3.1', '3D geometry: distance, volume and surface area'),
  ('AI', 'SL', 3, 2, '3.2', 'Sine rule, cosine rule and area of a triangle'),
  ('AI', 'SL', 3, 3, '3.3', 'Applications of trigonometry'),
  ('AI', 'SL', 3, 4, '3.4', 'Arc length and sector area'),
  ('AI', 'SL', 3, 5, '3.5', 'Perpendicular bisectors'),
  ('AI', 'SL', 3, 6, '3.6', 'Voronoi diagrams'),
  ('AI', 'AHL', 3, 7, '3.7', 'Radians'),
  ('AI', 'AHL', 3, 8, '3.8', 'Unit circle and trigonometric equations'),
  ('AI', 'AHL', 3, 9, '3.9', 'Matrix transformations'),
  ('AI', 'AHL', 3, 10, '3.10', 'Vectors: concepts and operations'),
  ('AI', 'AHL', 3, 11, '3.11', 'Vector equation of a line'),
  ('AI', 'AHL', 3, 12, '3.12', 'Vector kinematics'),
  ('AI', 'AHL', 3, 13, '3.13', 'Scalar and vector products'),
  ('AI', 'AHL', 3, 14, '3.14', 'Graph theory basics'),
  ('AI', 'AHL', 3, 15, '3.15', 'Adjacency matrices and walks'),
  ('AI', 'AHL', 3, 16, '3.16', 'Tree and cycle algorithms'),
  ('AI', 'SL', 4, 1, '4.1', 'Sampling and data'),
  ('AI', 'SL', 4, 2, '4.2', 'Presentation of data'),
  ('AI', 'SL', 4, 3, '4.3', 'Central tendency and dispersion'),
  ('AI', 'SL', 4, 4, '4.4', 'Linear correlation and regression'),
  ('AI', 'SL', 4, 5, '4.5', 'Probability concepts'),
  ('AI', 'SL', 4, 6, '4.6', 'Combined, conditional and independent events'),
  ('AI', 'SL', 4, 7, '4.7', 'Discrete random variables'),
  ('AI', 'SL', 4, 8, '4.8', 'Binomial distribution'),
  ('AI', 'SL', 4, 9, '4.9', 'Normal distribution'),
  ('AI', 'SL', 4, 10, '4.10', 'Spearman''s rank correlation'),
  ('AI', 'SL', 4, 11, '4.11', 'Hypothesis testing: chi-squared and t-test'),
  ('AI', 'AHL', 4, 12, '4.12', 'Study design and data collection'),
  ('AI', 'AHL', 4, 13, '4.13', 'Non-linear regression'),
  ('AI', 'AHL', 4, 14, '4.14', 'Linear combinations of random variables'),
  ('AI', 'AHL', 4, 15, '4.15', 'Central limit theorem'),
  ('AI', 'AHL', 4, 16, '4.16', 'Confidence intervals'),
  ('AI', 'AHL', 4, 17, '4.17', 'Poisson distribution'),
  ('AI', 'AHL', 4, 18, '4.18', 'Hypothesis tests and Type I/II errors'),
  ('AI', 'AHL', 4, 19, '4.19', 'Markov chains'),
  ('AI', 'SL', 5, 1, '5.1', 'Limits and the derivative'),
  ('AI', 'SL', 5, 2, '5.2', 'Increasing and decreasing functions'),
  ('AI', 'SL', 5, 3, '5.3', 'Differentiating powers and polynomials'),
  ('AI', 'SL', 5, 4, '5.4', 'Tangents and normals'),
  ('AI', 'SL', 5, 5, '5.5', 'Introduction to integration'),
  ('AI', 'SL', 5, 6, '5.6', 'Stationary points'),
  ('AI', 'SL', 5, 7, '5.7', 'Optimisation'),
  ('AI', 'SL', 5, 8, '5.8', 'Trapezoidal rule'),
  ('AI', 'AHL', 5, 9, '5.9', 'Derivatives of standard functions; chain, product and quotient rules'),
  ('AI', 'AHL', 5, 10, '5.10', 'Second derivative and inflection'),
  ('AI', 'AHL', 5, 11, '5.11', 'Further integration and substitution'),
  ('AI', 'AHL', 5, 12, '5.12', 'Areas and volumes of revolution'),
  ('AI', 'AHL', 5, 13, '5.13', 'Kinematics'),
  ('AI', 'AHL', 5, 14, '5.14', 'Setting up and separating differential equations'),
  ('AI', 'AHL', 5, 15, '5.15', 'Slope fields'),
  ('AI', 'AHL', 5, 16, '5.16', 'Euler''s method'),
  ('AI', 'AHL', 5, 17, '5.17', 'Phase portraits'),
  ('AI', 'AHL', 5, 18, '5.18', 'Second-order differential equations');

-- ── A student's course ──────────────────────────────────────────────────────

alter table public.profiles
  add column programme public.ib_programme,
  add column course    public.ib_course,
  add column level     public.ib_level,
  add constraint profiles_course_complete check (
    (programme is null and course is null and level is null)
    or (programme is not null and course is not null and level is not null)
  );

comment on column public.profiles.course is
  'IB Mathematics course. Null (with programme and level) means no syllabus tracker.';

-- Only the tutor (or trusted server code) sets a student's course.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = private, public, pg_temp
as $$
begin
  if private.is_tutor() or coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;

  -- Freeze everything a student has no business changing. Note this runs even
  -- when the row-level policy allowed the update: RLS decides *whether* the row
  -- may be written, this decides *which columns*.
  new.role := old.role;
  new.id := old.id;
  new.created_at := old.created_at;
  new.calendar_token := old.calendar_token;
  new.programme := old.programme;
  new.course := old.course;
  new.level := old.level;
  return new;
end;
$$;

revoke all on function private.guard_profile_update() from public, anon, authenticated;

-- ── Row level security ──────────────────────────────────────────────────────

alter table public.syllabus_topics enable row level security;

-- Read-only for everyone signed in; no write policies, so only migrations write.
create policy "syllabus readable by all signed in"
  on public.syllabus_topics for select to authenticated
  using (true);
