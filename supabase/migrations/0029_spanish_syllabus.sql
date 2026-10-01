-- ============================================================================
-- 0029 — Spanish ESO and Bachillerato syllabus reference data
--
-- Reference subtopics for the Spanish mathematics curriculum (LOMLOE):
-- - 3º ESO (Común)
-- - 4º ESO (Ciencias)
-- - 4º ESO (Sociales)
-- - 1º Bachillerato (Ciencias: Matemáticas I)
-- - 1º Bachillerato (Sociales: Matemáticas Aplicadas a las CCSS I)
-- - 2º Bachillerato (Ciencias: Matemáticas II)
-- - 2º Bachillerato (Sociales: Matemáticas Aplicadas a las CCSS II)
-- ============================================================================

insert into public.syllabus_topics (course, level, topic, subtopic, code, title) values
  -- ==========================================================================
  -- 3º ESO — Matemáticas (Común)
  -- ==========================================================================
  -- Bloque 1: Números
  ('3eso', 'Común', 1, 1, '1.1', 'Números enteros y racionales: operaciones combinadas'),
  ('3eso', 'Común', 1, 2, '1.2', 'Fracciones, decimales y fracción generatriz'),
  ('3eso', 'Común', 1, 3, '1.3', 'Potencias de exponente entero y propiedades'),
  ('3eso', 'Común', 1, 4, '1.4', 'Notación científica y operaciones elementales'),
  ('3eso', 'Común', 1, 5, '1.5', 'Raíces cuadradas y radicales exactos'),
  ('3eso', 'Común', 1, 6, '1.6', 'Jerarquía de operaciones y cálculo mental'),
  ('3eso', 'Común', 1, 7, '1.7', 'Proporcionalidad directa e inversa: regla de tres'),
  ('3eso', 'Común', 1, 8, '1.8', 'Porcentajes, aumentos y disminuciones porcentuales'),
  ('3eso', 'Común', 1, 9, '1.9', 'Interés simple'),

  -- Bloque 2: Álgebra
  ('3eso', 'Común', 2, 1, '2.1', 'Expresiones algebraicas y valor numérico'),
  ('3eso', 'Común', 2, 2, '2.2', 'Monomios y polinomios: operaciones básicas'),
  ('3eso', 'Común', 2, 3, '2.3', 'Identidades notables (cuadrado de suma, diferencia y suma por diferencia)'),
  ('3eso', 'Común', 2, 4, '2.4', 'Extracción de factor común'),
  ('3eso', 'Común', 2, 5, '2.5', 'Ecuaciones de primer grado con paréntesis y denominadores'),
  ('3eso', 'Común', 2, 6, '2.6', 'Ecuaciones de segundo grado completas e incompletas'),
  ('3eso', 'Común', 2, 7, '2.7', 'Resolución de problemas con ecuaciones'),
  ('3eso', 'Común', 2, 8, '2.8', 'Sistemas de ecuaciones lineales (sustitución, igualación, reducción)'),
  ('3eso', 'Común', 2, 9, '2.9', 'Resolución de problemas mediante sistemas lineales'),
  ('3eso', 'Común', 2, 10, '2.10', 'Progresiones aritméticas: término general y suma'),
  ('3eso', 'Común', 2, 11, '2.11', 'Progresiones geométricas: término general y suma'),

  -- Bloque 3: Geometría
  ('3eso', 'Común', 3, 1, '3.1', 'Teorema de Pitágoras y aplicaciones en el plano y espacio'),
  ('3eso', 'Común', 3, 2, '3.2', 'Teorema de Tales y semejanza de triángulos'),
  ('3eso', 'Común', 3, 3, '3.3', 'Escalas numéricas y gráficas en planos y mapas'),
  ('3eso', 'Común', 3, 4, '3.4', 'Áreas y perímetros de figuras planas compuestas'),
  ('3eso', 'Común', 3, 5, '3.5', 'Poliedros: prismas y pirámides (áreas y volúmenes)'),
  ('3eso', 'Común', 3, 6, '3.6', 'Cuerpos de revolución: cilindro, cono y esfera (áreas y volúmenes)'),

  -- Bloque 4: Funciones
  ('3eso', 'Común', 4, 1, '4.1', 'Coordenadas cartesianas e interpretación gráfica'),
  ('3eso', 'Común', 4, 2, '4.2', 'Concepto de función: dominio, recorrido y continuidad'),
  ('3eso', 'Común', 4, 3, '4.3', 'Crecimiento, decrecimiento, máximos y mínimos'),
  ('3eso', 'Común', 4, 4, '4.4', 'Función lineal y afín: pendiente y ordenada en el origen'),
  ('3eso', 'Común', 4, 5, '4.5', 'Ecuación de la recta a partir de puntos o pendiente'),
  ('3eso', 'Común', 4, 6, '4.6', 'Función cuadrática: parábolas y vértices'),

  -- Bloque 5: Estadística y Probabilidad
  ('3eso', 'Común', 5, 1, '5.1', 'Población, muestra y tipos de variables estadísticas'),
  ('3eso', 'Común', 5, 2, '5.2', 'Tablas de frecuencias y gráficos (histogramas, sectores, barras)'),
  ('3eso', 'Común', 5, 3, '5.3', 'Medidas de centralización: media, mediana y moda'),
  ('3eso', 'Común', 5, 4, '5.4', 'Medidas de dispersión: rango, varianza y desviación típica'),
  ('3eso', 'Común', 5, 5, '5.5', 'Experimentos aleatorios, espacio muestral y regla de Laplace'),
  ('3eso', 'Común', 5, 6, '5.6', 'Probabilidad de sucesos compuestos y diagramas de árbol'),

  -- ==========================================================================
  -- 4º ESO — Matemáticas (Ciencias)
  -- ==========================================================================
  -- Bloque 1: Números y Operaciones
  ('4eso', 'Ciencias', 1, 1, '1.1', 'Números reales: clasificación y recta real'),
  ('4eso', 'Ciencias', 1, 2, '1.2', 'Intervalos y semirrectas'),
  ('4eso', 'Ciencias', 1, 3, '1.3', 'Radicales: simplificación, producto, cociente y extracción'),
  ('4eso', 'Ciencias', 1, 4, '1.4', 'Racionalización de denominadores'),
  ('4eso', 'Ciencias', 1, 5, '1.5', 'Logaritmos: definición y propiedades fundamentales'),
  ('4eso', 'Ciencias', 1, 6, '1.6', 'Notación científica, errores absoluto y relativo'),

  -- Bloque 2: Álgebra
  ('4eso', 'Ciencias', 2, 1, '2.1', 'Polinomios: división y regla de Ruffini'),
  ('4eso', 'Ciencias', 2, 2, '2.2', 'Teorema del resto y del factor'),
  ('4eso', 'Ciencias', 2, 3, '2.3', 'Factorización de polinomios'),
  ('4eso', 'Ciencias', 2, 4, '2.4', 'Fracciones algebraicas: simplificación y operaciones'),
  ('4eso', 'Ciencias', 2, 5, '2.5', 'Ecuaciones de grado superior factorizables'),
  ('4eso', 'Ciencias', 2, 6, '2.6', 'Ecuaciones bicuadradas'),
  ('4eso', 'Ciencias', 2, 7, '2.7', 'Ecuaciones racionales y con radicales'),
  ('4eso', 'Ciencias', 2, 8, '2.8', 'Inecuaciones de primer y segundo grado con una incógnita'),
  ('4eso', 'Ciencias', 2, 9, '2.9', 'Sistemas de ecuaciones lineales y no lineales'),
  ('4eso', 'Ciencias', 2, 10, '2.10', 'Resolución de problemas algebraicos complejos'),

  -- Bloque 3: Geometría y Trigonometría
  ('4eso', 'Ciencias', 3, 1, '3.1', 'Medida de ángulos: grados sexagesimales y radianes'),
  ('4eso', 'Ciencias', 3, 2, '3.2', 'Razones trigonométricas en el triángulo rectángulo (sen, cos, tan)'),
  ('4eso', 'Ciencias', 3, 3, '3.3', 'Circunferencia goniométrica y signos por cuadrantes'),
  ('4eso', 'Ciencias', 3, 4, '3.4', 'Relaciones fundamentales de la trigonometría'),
  ('4eso', 'Ciencias', 3, 5, '3.5', 'Resolución de triángulos rectángulos y problemas de doble observación'),
  ('4eso', 'Ciencias', 3, 6, '3.6', 'Vectores en el plano: coordenadas, módulo y operaciones'),
  ('4eso', 'Ciencias', 3, 7, '3.7', 'Ecuaciones de la recta en el plano (vectorial, paramétrica, continua, general)'),

  -- Bloque 4: Funciones
  ('4eso', 'Ciencias', 4, 1, '4.1', 'Propiedades de funciones: dominio, recorrido, simetría y periodicidad'),
  ('4eso', 'Ciencias', 4, 2, '4.2', 'Funciones lineales y cuadráticas: representación analítica y gráfica'),
  ('4eso', 'Ciencias', 4, 3, '4.3', 'Funciones definidas a trozos'),
  ('4eso', 'Ciencias', 4, 4, '4.4', 'Funciones racionales sencillas e hipérbolas'),
  ('4eso', 'Ciencias', 4, 5, '4.5', 'Funciones exponenciales y logarítmicas: características y gráficas'),
  ('4eso', 'Ciencias', 4, 6, '4.6', 'Transformaciones de funciones: traslaciones verticales y horizontales'),

  -- Bloque 5: Estadística y Probabilidad
  ('4eso', 'Ciencias', 5, 1, '5.1', 'Variables bidimensionales: nubes de puntos'),
  ('4eso', 'Ciencias', 5, 2, '5.2', 'Correlación lineal y recta de regresión'),
  ('4eso', 'Ciencias', 5, 3, '5.3', 'Combinatoria básica: variaciones, permutaciones y combinaciones'),
  ('4eso', 'Ciencias', 5, 4, '5.4', 'Probabilidad de la unión e intersección de sucesos'),
  ('4eso', 'Ciencias', 5, 5, '5.5', 'Sucesos dependientes e independientes: probabilidad condicionada'),
  ('4eso', 'Ciencias', 5, 6, '5.6', 'Tablas de contingencia y diagramas de árbol'),

  -- ==========================================================================
  -- 4º ESO — Matemáticas (Sociales)
  -- ==========================================================================
  -- Bloque 1: Números y Matemática Financiera
  ('4eso', 'Sociales', 1, 1, '1.1', 'Números reales: racionales e irracionales'),
  ('4eso', 'Sociales', 1, 2, '1.2', 'Aproximaciones y redondeo: error absoluto y relativo'),
  ('4eso', 'Sociales', 1, 3, '1.3', 'Potencias y radicales: operaciones básicas'),
  ('4eso', 'Sociales', 1, 4, '1.4', 'Notación científica en magnitudes socioeconómicas'),
  ('4eso', 'Sociales', 1, 5, '1.5', 'Porcentajes encadenados e índices de variación'),
  ('4eso', 'Sociales', 1, 6, '1.6', 'Interés simple e interés compuesto: tasa anual equivalente (TAE)'),
  ('4eso', 'Sociales', 1, 7, '1.7', 'Préstamos y cuotas: amortizaciones básicas'),

  -- Bloque 2: Álgebra
  ('4eso', 'Sociales', 2, 1, '2.1', 'Polinomios: operaciones e identidades notables'),
  ('4eso', 'Sociales', 2, 2, '2.2', 'Factorización de polinomios y raíces'),
  ('4eso', 'Sociales', 2, 3, '2.3', 'Fracciones algebraicas sencillas'),
  ('4eso', 'Sociales', 2, 4, '2.4', 'Ecuaciones de primer y segundo grado'),
  ('4eso', 'Sociales', 2, 5, '2.5', 'Ecuaciones bicuadradas y racionales inmediatas'),
  ('4eso', 'Sociales', 2, 6, '2.6', 'Inecuaciones de primer y segundo grado'),
  ('4eso', 'Sociales', 2, 7, '2.7', 'Sistemas lineales con dos incógnitas'),
  ('4eso', 'Sociales', 2, 8, '2.8', 'Sistemas de inecuaciones lineales'),
  ('4eso', 'Sociales', 2, 9, '2.9', 'Modelización de situaciones económicas mediante álgebra'),

  -- Bloque 3: Geometría práctica
  ('4eso', 'Sociales', 3, 1, '3.1', 'Teorema de Pitágoras y Tales en contextos reales'),
  ('4eso', 'Sociales', 3, 2, '3.2', 'Semejanza y escalas en mapas, maquetas y planos'),
  ('4eso', 'Sociales', 3, 3, '3.3', 'Áreas y perímetros en diseño y urbanismo'),
  ('4eso', 'Sociales', 3, 4, '3.4', 'Volúmenes de cuerpos geométricos en envases y arquitectura'),
  ('4eso', 'Sociales', 3, 5, '3.5', 'Razones trigonométricas básicas para cálculo de distancias'),

  -- Bloque 4: Funciones
  ('4eso', 'Sociales', 4, 1, '4.1', 'Concepto de función y estudio de gráficas en medios de comunicación'),
  ('4eso', 'Sociales', 4, 2, '4.2', 'Dominio, recorrido, continuidad y tendencias'),
  ('4eso', 'Sociales', 4, 3, '4.3', 'Funciones lineales y afines: costes fijos, variables e ingresos'),
  ('4eso', 'Sociales', 4, 4, '4.4', 'Funciones cuadráticas: cálculo de beneficios máximos y costes mínimos'),
  ('4eso', 'Sociales', 4, 5, '4.5', 'Funciones a trozos en tarifas de servicios e impuestos'),
  ('4eso', 'Sociales', 4, 6, '4.6', 'Funciones exponenciales en modelos demográficos y financieros'),
  ('4eso', 'Sociales', 4, 7, '4.7', 'Interpretación crítica de gráficas estadísticas y económicas'),

  -- Bloque 5: Estadística y Probabilidad
  ('4eso', 'Sociales', 5, 1, '5.1', 'Estadística unidimensional: parámetros centrales y de dispersión'),
  ('4eso', 'Sociales', 5, 2, '5.2', 'Distribuciones bidimensionales: tablas de doble entrada y nubes de puntos'),
  ('4eso', 'Sociales', 5, 3, '5.3', 'Coeficiente de correlación lineal y relación causa-efecto'),
  ('4eso', 'Sociales', 5, 4, '5.4', 'Recta de regresión y estimaciones estadísticas'),
  ('4eso', 'Sociales', 5, 5, '5.5', 'Experimentos aleatorios y regla de Laplace'),
  ('4eso', 'Sociales', 5, 6, '5.6', 'Probabilidad condicionada e independencia en encuestas y sondeos'),
  ('4eso', 'Sociales', 5, 7, '5.7', 'Diagramas de árbol aplicados a la toma de decisiones'),

  -- ==========================================================================
  -- 1º Bachillerato — Ciencias (Matemáticas I)
  -- ==========================================================================
  -- Bloque 1: Números y Álgebra
  ('1bach', 'Ciencias', 1, 1, '1.1', 'Números reales: propiedades, axiomas y valor absoluto'),
  ('1bach', 'Ciencias', 1, 2, '1.2', 'Radicales y racionalización avanzada'),
  ('1bach', 'Ciencias', 1, 3, '1.3', 'Logaritmos: propiedades, identidades y ecuaciones logarítmicas'),
  ('1bach', 'Ciencias', 1, 4, '1.4', 'Números complejos en forma binómica: operaciones'),
  ('1bach', 'Ciencias', 1, 5, '1.5', 'Números complejos en forma polar: fórmula de De Moivre y raíces'),
  ('1bach', 'Ciencias', 1, 6, '1.6', 'Factorización de polinomios y regla de Ruffini'),
  ('1bach', 'Ciencias', 1, 7, '1.7', 'Fracciones algebraicas y descomposición en fracciones simples'),
  ('1bach', 'Ciencias', 1, 8, '1.8', 'Ecuaciones racionales, irracionales y exponenciales'),
  ('1bach', 'Ciencias', 1, 9, '1.9', 'Inecuaciones polinómicas y racionales: resolución gráfica y analítica'),
  ('1bach', 'Ciencias', 1, 10, '1.10', 'Sistemas lineales: método de eliminación de Gauss'),
  ('1bach', 'Ciencias', 1, 11, '1.11', 'Sistemas de ecuaciones no lineales'),

  -- Bloque 2: Trigonometría
  ('1bach', 'Ciencias', 2, 1, '2.1', 'Razones trigonométricas en la circunferencia goniométrica'),
  ('1bach', 'Ciencias', 2, 2, '2.2', 'Fórmulas trigonométricas: suma, diferencia, ángulo doble y mitad'),
  ('1bach', 'Ciencias', 2, 3, '2.3', 'Transformación de sumas en productos y simplificación trigonométrica'),
  ('1bach', 'Ciencias', 2, 4, '2.4', 'Ecuaciones trigonométricas fundamentales'),
  ('1bach', 'Ciencias', 2, 5, '2.5', 'Teorema del seno y teorema del coseno'),
  ('1bach', 'Ciencias', 2, 6, '2.6', 'Resolución de triángulos y aplicaciones geométricas'),

  -- Bloque 3: Geometría analítica en el plano
  ('1bach', 'Ciencias', 3, 1, '3.1', 'Vectores en el plano: bases ortonormales y producto escalar'),
  ('1bach', 'Ciencias', 3, 2, '3.2', 'Módulo de un vector, ángulo entre vectores y ortogonalidad'),
  ('1bach', 'Ciencias', 3, 3, '3.3', 'Ecuaciones de la recta: vectorial, paramétrica, continua, explícita y general'),
  ('1bach', 'Ciencias', 3, 4, '3.4', 'Posiciones relativas de dos rectas y haces de rectas'),
  ('1bach', 'Ciencias', 3, 5, '3.5', 'Distancia de un punto a una recta y ángulo entre rectas'),
  ('1bach', 'Ciencias', 3, 6, '3.6', 'Lugares geométricos: mediatriz y bisectriz'),
  ('1bach', 'Ciencias', 3, 7, '3.7', 'Cónicas: circunferencia (ecuación canónica, centro y radio)'),
  ('1bach', 'Ciencias', 3, 8, '3.8', 'Cónicas: elipse, hipérbola y parábola (ecuaciones reducidas)'),

  -- Bloque 4: Funciones, Límites y Continuidad
  ('1bach', 'Ciencias', 4, 1, '4.1', 'Concepto de función, dominio y recorrido de funciones elementales'),
  ('1bach', 'Ciencias', 4, 2, '4.2', 'Composición de funciones y función inversa o recíproca'),
  ('1bach', 'Ciencias', 4, 3, '4.3', 'Límite de una función en el infinito y comportamiento asintótico'),
  ('1bach', 'Ciencias', 4, 4, '4.4', 'Límite de una función en un punto y límites laterales'),
  ('1bach', 'Ciencias', 4, 5, '4.5', 'Cálculo de indeterminaciones: 0/0, infinito/infinito, infinito - infinito'),
  ('1bach', 'Ciencias', 4, 6, '4.6', 'Asíntotas verticales, horizontales y oblicuas'),
  ('1bach', 'Ciencias', 4, 7, '4.7', 'Continuidad de una función y tipos de discontinuidades'),

  -- Bloque 5: Cálculo diferencial (Derivadas)
  ('1bach', 'Ciencias', 5, 1, '5.1', 'Tasa de variación media e instantánea: concepto de derivada'),
  ('1bach', 'Ciencias', 5, 2, '5.2', 'Interpretación geométrica de la derivada: recta tangente y normal'),
  ('1bach', 'Ciencias', 5, 3, '5.3', 'Función derivada y reglas de derivación de funciones elementales'),
  ('1bach', 'Ciencias', 5, 4, '5.4', 'Regla de la cadena para funciones compuestas'),
  ('1bach', 'Ciencias', 5, 5, '5.5', 'Monotonía: intervalos de crecimiento y decrecimiento'),
  ('1bach', 'Ciencias', 5, 6, '5.6', 'Extremos relativos: máximos y mínimos locales'),
  ('1bach', 'Ciencias', 5, 7, '5.7', 'Curvatura (concavidad y convexidad) y puntos de inflexión'),
  ('1bach', 'Ciencias', 5, 8, '5.8', 'Representación gráfica de funciones polinómicas y racionales'),
  ('1bach', 'Ciencias', 5, 9, '5.9', 'Problemas de optimización sencillos'),

  -- Bloque 6: Estadística y Probabilidad
  ('1bach', 'Ciencias', 6, 1, '6.1', 'Distribuciones bidimensionales: covarianza y correlación de Pearson'),
  ('1bach', 'Ciencias', 6, 2, '6.2', 'Rectas de regresión de mínimos cuadrados y fiabilidad'),
  ('1bach', 'Ciencias', 6, 3, '6.3', 'Combinatoria: variaciones, permutaciones y combinaciones con/sin repetición'),
  ('1bach', 'Ciencias', 6, 4, '6.4', 'Axiomas de probabilidad y álgebra de sucesos'),
  ('1bach', 'Ciencias', 6, 5, '6.5', 'Probabilidad condicionada e independencia de sucesos'),
  ('1bach', 'Ciencias', 6, 6, '6.6', 'Teorema de la probabilidad total y Teorema de Bayes'),
  ('1bach', 'Ciencias', 6, 7, '6.7', 'Distribución Binomial: función de probabilidad y parámetros'),
  ('1bach', 'Ciencias', 6, 8, '6.8', 'Distribución Normal: tipificación y manejo de tablas'),

  -- ==========================================================================
  -- 1º Bachillerato — Sociales (Matemáticas Aplicadas a las CCSS I)
  -- ==========================================================================
  -- Bloque 1: Aritmética y Matemática financiera
  ('1bach', 'Sociales', 1, 1, '1.1', 'Números reales: intervalos, desigualdades y valor absoluto'),
  ('1bach', 'Sociales', 1, 2, '1.2', 'Porcentajes: aumentos, disminuciones, tasas e índices'),
  ('1bach', 'Sociales', 1, 3, '1.3', 'Interés simple y compuesto: periodos de capitalización'),
  ('1bach', 'Sociales', 1, 4, '1.4', 'Tasa Anual Equivalente (TAE) y amortizaciones'),
  ('1bach', 'Sociales', 1, 5, '1.5', 'Anualidades de capitalización (planes de ahorro)'),
  ('1bach', 'Sociales', 1, 6, '1.6', 'Anualidades de amortización (préstamos y cuotas periódicas)'),

  -- Bloque 2: Álgebra
  ('1bach', 'Sociales', 2, 1, '2.1', 'Polinomios: factorización y regla de Ruffini'),
  ('1bach', 'Sociales', 2, 2, '2.2', 'Fracciones algebraicas: simplificación y operaciones'),
  ('1bach', 'Sociales', 2, 3, '2.3', 'Ecuaciones polinómicas, racionales y radicales'),
  ('1bach', 'Sociales', 2, 4, '2.4', 'Ecuaciones exponenciales y logarítmicas en economía'),
  ('1bach', 'Sociales', 2, 5, '2.5', 'Inecuaciones lineales con una y dos incógnitas'),
  ('1bach', 'Sociales', 2, 6, '2.6', 'Sistemas lineales: método de eliminación de Gauss'),
  ('1bach', 'Sociales', 2, 7, '2.7', 'Resolución de problemas contextualizados en ciencias sociales'),

  -- Bloque 3: Funciones y Límites
  ('1bach', 'Sociales', 3, 1, '3.1', 'Concepto de función, dominio y recorrido en economía'),
  ('1bach', 'Sociales', 3, 2, '3.2', 'Funciones polinómicas: modelos de oferta, demanda y beneficio'),
  ('1bach', 'Sociales', 3, 3, '3.3', 'Funciones racionales y definidas a trozos'),
  ('1bach', 'Sociales', 3, 4, '3.4', 'Funciones exponenciales y logarítmicas en demografía'),
  ('1bach', 'Sociales', 3, 5, '3.5', 'Composición de funciones y función inversa'),
  ('1bach', 'Sociales', 3, 6, '3.6', 'Límite de una función en el infinito y en un punto'),
  ('1bach', 'Sociales', 3, 7, '3.7', 'Cálculo de indeterminaciones algebraicas básicas'),
  ('1bach', 'Sociales', 3, 8, '3.8', 'Asíntotas verticales y horizontales'),
  ('1bach', 'Sociales', 3, 9, '3.9', 'Continuidad de funciones y tipos de discontinuidades'),

  -- Bloque 4: Derivadas y Aplicaciones
  ('1bach', 'Sociales', 4, 1, '4.1', 'Tasa de variación media e instantánea en contextos socioeconómicos'),
  ('1bach', 'Sociales', 4, 2, '4.2', 'Concepto de derivada en un punto y recta tangente'),
  ('1bach', 'Sociales', 4, 3, '4.3', 'Reglas de derivación de funciones elementales'),
  ('1bach', 'Sociales', 4, 4, '4.4', 'Regla de la cadena'),
  ('1bach', 'Sociales', 4, 5, '4.5', 'Monotonía: funciones crecientes y decrecientes'),
  ('1bach', 'Sociales', 4, 6, '4.6', 'Extremos relativos: cálculo de máximos y mínimos'),
  ('1bach', 'Sociales', 4, 7, '4.7', 'Optimización económica: beneficio máximo, coste mínimo e ingresos'),

  -- Bloque 5: Estadística y Probabilidad
  ('1bach', 'Sociales', 5, 1, '5.1', 'Distribuciones bidimensionales: tablas de doble entrada y nubes de puntos'),
  ('1bach', 'Sociales', 5, 2, '5.2', 'Covarianza y coeficiente de correlación lineal'),
  ('1bach', 'Sociales', 5, 3, '5.3', 'Recta de regresión e interpolación'),
  ('1bach', 'Sociales', 5, 4, '5.4', 'Espacio muestral, sucesos y axiomas de probabilidad'),
  ('1bach', 'Sociales', 5, 5, '5.5', 'Probabilidad condicionada e independencia'),
  ('1bach', 'Sociales', 5, 6, '5.6', 'Teorema de la probabilidad total y Teorema de Bayes'),
  ('1bach', 'Sociales', 5, 7, '5.7', 'Distribución Binomial y distribución Normal en ciencias sociales'),

  -- ==========================================================================
  -- 2º Bachillerato — Ciencias (Matemáticas II)
  -- ==========================================================================
  -- Bloque 1: Álgebra Lineal
  ('2bach', 'Ciencias', 1, 1, '1.1', 'Matrices: definición, tipos y operaciones matriciales'),
  ('2bach', 'Ciencias', 1, 2, '1.2', 'Matriz traspuesta: propiedades, simetría y antisimetría'),
  ('2bach', 'Ciencias', 1, 3, '1.3', 'Determinantes de orden 2 y 3: Regla de Sarrus y propiedades'),
  ('2bach', 'Ciencias', 1, 4, '1.4', 'Determinantes de orden superior: desarrollo por adjuntos'),
  ('2bach', 'Ciencias', 1, 5, '1.5', 'Rango de una matriz: método de Gauss y cálculo por menores'),
  ('2bach', 'Ciencias', 1, 6, '1.6', 'Matriz inversa: condición de regularidad y cálculo por adjuntos'),
  ('2bach', 'Ciencias', 1, 7, '1.7', 'Ecuaciones y sistemas de ecuaciones matriciales'),
  ('2bach', 'Ciencias', 1, 8, '1.8', 'Expresión matricial de un sistema de ecuaciones lineales'),
  ('2bach', 'Ciencias', 1, 9, '1.9', 'Teorema de Rouché-Frobenius: discusión y clasificación de sistemas'),
  ('2bach', 'Ciencias', 1, 10, '1.10', 'Regla de Cramer para sistemas compatibles determinados'),
  ('2bach', 'Ciencias', 1, 11, '1.11', 'Discusión y resolución de sistemas lineales dependientes de parámetros'),
  ('2bach', 'Ciencias', 1, 12, '1.12', 'Sistemas homogéneos: discusión con parámetros'),

  -- Bloque 2: Geometría en el Espacio
  ('2bach', 'Ciencias', 2, 1, '2.1', 'Vectores en el espacio tridimensional: base ortonormal y operaciones'),
  ('2bach', 'Ciencias', 2, 2, '2.2', 'Producto escalar: definición, propiedades, módulo y ortogonalidad'),
  ('2bach', 'Ciencias', 2, 3, '2.3', 'Producto vectorial: cálculo, propiedades y área de paralelogramos'),
  ('2bach', 'Ciencias', 2, 4, '2.4', 'Producto mixto: cálculo y volumen de paralelepípedos y tetraedros'),
  ('2bach', 'Ciencias', 2, 5, '2.5', 'Ecuaciones de la recta en el espacio (vectorial, paramétrica, continua, implícita)'),
  ('2bach', 'Ciencias', 2, 6, '2.6', 'Ecuaciones del plano en el espacio (vectorial, paramétrica, general)'),
  ('2bach', 'Ciencias', 2, 7, '2.7', 'Posiciones relativas de dos rectas en el espacio'),
  ('2bach', 'Ciencias', 2, 8, '2.8', 'Posiciones relativas de recta y plano'),
  ('2bach', 'Ciencias', 2, 9, '2.9', 'Posiciones relativas de dos y tres planos: haces de planos'),
  ('2bach', 'Ciencias', 2, 10, '2.10', 'Ángulos entre rectas, entre planos y entre recta y plano'),
  ('2bach', 'Ciencias', 2, 11, '2.11', 'Distancias entre puntos, de punto a recta y de punto a plano'),
  ('2bach', 'Ciencias', 2, 12, '2.12', 'Distancia entre planos paralelos y entre rectas que se cruzan'),
  ('2bach', 'Ciencias', 2, 13, '2.13', 'Proyecciones ortogonales y puntos simétricos respecto a rectas y planos'),

  -- Bloque 3: Análisis: Continuidad y Derivabilidad
  ('2bach', 'Ciencias', 3, 1, '3.1', 'Límites de funciones y cálculo de indeterminaciones'),
  ('2bach', 'Ciencias', 3, 2, '3.2', 'Regla de L''Hôpital para cálculo de límites'),
  ('2bach', 'Ciencias', 3, 3, '3.3', 'Continuidad: Teorema de Bolzano y Teorema de Weierstrass'),
  ('2bach', 'Ciencias', 3, 4, '3.4', 'Derivabilidad: relación con la continuidad y derivadas laterales'),
  ('2bach', 'Ciencias', 3, 5, '3.5', 'Teorema de Rolle y Teorema del Valor Medio de Lagrange'),
  ('2bach', 'Ciencias', 3, 6, '3.6', 'Recta tangente y normal a una curva en un punto'),
  ('2bach', 'Ciencias', 3, 7, '3.7', 'Monotonía y extremos relativos (criterio de derivadas sucesivas)'),
  ('2bach', 'Ciencias', 3, 8, '3.8', 'Curvatura (concavidad y convexidad) y puntos de inflexión'),
  ('2bach', 'Ciencias', 3, 9, '3.9', 'Problemas de optimización global'),
  ('2bach', 'Ciencias', 3, 10, '3.10', 'Estudio completo y representación gráfica de funciones'),

  -- Bloque 4: Análisis: Cálculo Integral
  ('2bach', 'Ciencias', 4, 1, '4.1', 'Concepto de primitiva e integral indefinida: propiedades'),
  ('2bach', 'Ciencias', 4, 2, '4.2', 'Integrales inmediatas y casi inmediatas'),
  ('2bach', 'Ciencias', 4, 3, '4.3', 'Integración por cambio de variable (sustitución)'),
  ('2bach', 'Ciencias', 4, 4, '4.4', 'Integración por partes'),
  ('2bach', 'Ciencias', 4, 5, '4.5', 'Integración de funciones racionales con raíces reales'),
  ('2bach', 'Ciencias', 4, 6, '4.6', 'Integral definida y Teorema del Valor Medio del cálculo integral'),
  ('2bach', 'Ciencias', 4, 7, '4.7', 'Teorema Fundamental del Cálculo y Regla de Barrow'),
  ('2bach', 'Ciencias', 4, 8, '4.8', 'Cálculo de áreas de recintos planos bajo una curva'),
  ('2bach', 'Ciencias', 4, 9, '4.9', 'Cálculo de áreas comprendidas entre dos funciones'),

  -- Bloque 5: Probabilidad y Distribuciones
  ('2bach', 'Ciencias', 5, 1, '5.1', 'Espacio muestral, sucesos y álgebra de sucesos'),
  ('2bach', 'Ciencias', 5, 2, '5.2', 'Probabilidad condicionada e independencia de sucesos'),
  ('2bach', 'Ciencias', 5, 3, '5.3', 'Teorema de la probabilidad total y Teorema de Bayes'),
  ('2bach', 'Ciencias', 5, 4, '5.4', 'Variables aleatorias discretas: distribución Binomial B(n, p)'),
  ('2bach', 'Ciencias', 5, 5, '5.5', 'Variables aleatorias continuas: función de densidad y distribución'),
  ('2bach', 'Ciencias', 5, 6, '5.6', 'Distribución Normal N(μ, σ): propiedades, tipificación y cálculo de probabilidades'),
  ('2bach', 'Ciencias', 5, 7, '5.7', 'Aproximación de la distribución Binomial por la Normal'),

  -- ==========================================================================
  -- 2º Bachillerato — Sociales (Matemáticas Aplicadas a las CCSS II)
  -- ==========================================================================
  -- Bloque 1: Álgebra Matricial
  ('2bach', 'Sociales', 1, 1, '1.1', 'Matrices: tipos, dimensiones y operaciones matriciales'),
  ('2bach', 'Sociales', 1, 2, '1.2', 'Producto de matrices y propiedades del producto'),
  ('2bach', 'Sociales', 1, 3, '1.3', 'Determinantes de orden 2 y 3 (Regla de Sarrus) y propiedades'),
  ('2bach', 'Sociales', 1, 4, '1.4', 'Rango de una matriz por Gauss y por menores'),
  ('2bach', 'Sociales', 1, 5, '1.5', 'Matriz inversa: cálculo por la matriz adjunta'),
  ('2bach', 'Sociales', 1, 6, '1.6', 'Ecuaciones y sistemas matriciales'),
  ('2bach', 'Sociales', 1, 7, '1.7', 'Discusión y resolución de sistemas de ecuaciones lineales mediante Gauss'),
  ('2bach', 'Sociales', 1, 8, '1.8', 'Regla de Cramer para sistemas de dos y tres ecuaciones'),
  ('2bach', 'Sociales', 1, 9, '1.9', 'Resolución de problemas socioeconómicos formulados mediante sistemas'),

  -- Bloque 2: Programación Lineal
  ('2bach', 'Sociales', 2, 1, '2.1', 'Inecuaciones lineales con dos incógnitas y semiplanos'),
  ('2bach', 'Sociales', 2, 2, '2.2', 'Sistemas de inecuaciones: región factible acotada y no acotada'),
  ('2bach', 'Sociales', 2, 3, '2.3', 'Determinación algebraica de los vértices de la región factible'),
  ('2bach', 'Sociales', 2, 4, '2.4', 'Función objetivo: formulación en problemas de optimización'),
  ('2bach', 'Sociales', 2, 5, '2.5', 'Teorema fundamental de la programación lineal: optimización en vértices'),
  ('2bach', 'Sociales', 2, 6, '2.6', 'Método gráfico y analítico de resolución de programación lineal'),
  ('2bach', 'Sociales', 2, 7, '2.7', 'Interpretación económica de las soluciones óptimas únicas y múltiples'),

  -- Bloque 3: Análisis Matemático
  ('2bach', 'Sociales', 3, 1, '3.1', 'Límites de funciones en el infinito y en un punto: indeterminaciones'),
  ('2bach', 'Sociales', 3, 2, '3.2', 'Continuidad de funciones y tipos de discontinuidades'),
  ('2bach', 'Sociales', 3, 3, '3.3', 'Teorema de Bolzano y existencia de soluciones en problemas reales'),
  ('2bach', 'Sociales', 3, 4, '3.4', 'Derivada en un punto e interpretación económica (tasa marginal)'),
  ('2bach', 'Sociales', 3, 5, '3.5', 'Reglas de derivación de funciones elementales y regla de la cadena'),
  ('2bach', 'Sociales', 3, 6, '3.6', 'Recta tangente a una función en un punto'),
  ('2bach', 'Sociales', 3, 7, '3.7', 'Intervalos de crecimiento, decrecimiento y extremos relativos'),
  ('2bach', 'Sociales', 3, 8, '3.8', 'Concavidad, convexidad y puntos de inflexión'),
  ('2bach', 'Sociales', 3, 9, '3.9', 'Problemas de optimización: maximización de beneficios y minimización de costes'),
  ('2bach', 'Sociales', 3, 10, '3.10', 'Representación gráfica de funciones polinómicas y racionales'),
  ('2bach', 'Sociales', 3, 11, '3.11', 'Integral indefinida: primitivas inmediatas'),
  ('2bach', 'Sociales', 3, 12, '3.12', 'Integral definida y Regla de Barrow'),
  ('2bach', 'Sociales', 3, 13, '3.13', 'Cálculo de áreas de recintos planos bajo curvas'),

  -- Bloque 4: Probabilidad
  ('2bach', 'Sociales', 4, 1, '4.1', 'Experimentos aleatorios, sucesos y leyes de De Morgan'),
  ('2bach', 'Sociales', 4, 2, '4.2', 'Axiomas de probabilidad y regla de Laplace'),
  ('2bach', 'Sociales', 4, 3, '4.3', 'Probabilidad condicionada e independencia de sucesos'),
  ('2bach', 'Sociales', 4, 4, '4.4', 'Tablas de contingencia y diagramas de árbol en contextos biomédicos y sociales'),
  ('2bach', 'Sociales', 4, 5, '4.5', 'Teorema de la probabilidad total'),
  ('2bach', 'Sociales', 4, 6, '4.6', 'Teorema de Bayes y cálculo de probabilidades a posteriori'),

  -- Bloque 5: Inferencia Estadística
  ('2bach', 'Sociales', 5, 1, '5.1', 'Población y muestra: métodos de muestreo probabilístico'),
  ('2bach', 'Sociales', 5, 2, '5.2', 'Parámetros poblacionales y estadísticos muestrales'),
  ('2bach', 'Sociales', 5, 3, '5.3', 'Teorema Central del Límite'),
  ('2bach', 'Sociales', 5, 4, '5.4', 'Distribución muestral de medias: esperanza y error estándar'),
  ('2bach', 'Sociales', 5, 5, '5.5', 'Distribución muestral de proporciones: esperanza y error estándar'),
  ('2bach', 'Sociales', 5, 6, '5.6', 'Intervalo de confianza para la media de una población normal'),
  ('2bach', 'Sociales', 5, 7, '5.7', 'Intervalo de confianza para la proporción de una población'),
  ('2bach', 'Sociales', 5, 8, '5.8', 'Nivel de confianza (1 - α), valor crítico z_α/2 y margen de error'),
  ('2bach', 'Sociales', 5, 9, '5.9', 'Cálculo del tamaño muestral mínimo admisible'),
  ('2bach', 'Sociales', 5, 10, '5.10', 'Interpretación y contraste elemental de hipótesis estadísticas')
on conflict (course, level, code) do update set
  title = excluded.title;
