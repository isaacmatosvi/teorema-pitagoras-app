const sides = {
  a: document.querySelector("#sideA"),
  b: document.querySelector("#sideB"),
  c: document.querySelector("#sideC"),
};

const examples = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 9, 12],
  [6, 8, 10],
];

const exercises = [
  {
    sides: [6, 8, 10],
    answer: "yes",
    explain: "6² + 8² = 36 + 64 = 100, y 10² = 100.",
  },
  {
    sides: [4, 7, 9],
    answer: "no",
    explain: "4² + 7² = 65, pero 9² = 81.",
  },
  {
    sides: [9, 12, 15],
    answer: "yes",
    explain: "9² + 12² = 81 + 144 = 225, y 15² = 225.",
  },
  {
    sides: [2, 3, 4],
    answer: "no",
    explain: "2² + 3² = 13, pero 4² = 16.",
  },
];

let exampleIndex = 0;
let exerciseIndex = 0;
let solvedExercises = 0;

const statusBadge = document.querySelector("#statusBadge");
const resultTitle = document.querySelector("#resultTitle");
const resultText = document.querySelector("#resultText");
const formulaLine = document.querySelector("#formulaLine");
const aiFeedback = document.querySelector("#aiFeedback");
const stepList = document.querySelector("#stepList");
const progressLabel = document.querySelector("#progressLabel");
const progressBar = document.querySelector("#progressBar");
const labels = {
  a: document.querySelector("#labelA"),
  b: document.querySelector("#labelB"),
  c: document.querySelector("#labelC"),
};

function square(value) {
  return Number((value * value).toFixed(4));
}

function cleanNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function readSides() {
  return [Number(sides.a.value), Number(sides.b.value), Number(sides.c.value)];
}

function analyzeTriangle(values) {
  const sorted = [...values].sort((x, y) => x - y);
  const [cathetusA, cathetusB, hypotenuse] = sorted;
  const allPositive = values.every((value) => Number.isFinite(value) && value > 0);
  const isTriangle = allPositive && cathetusA + cathetusB > hypotenuse;
  const left = square(cathetusA) + square(cathetusB);
  const right = square(hypotenuse);
  const difference = Math.abs(left - right);
  const tolerance = 0.01;

  return {
    sorted,
    cathetusA,
    cathetusB,
    hypotenuse,
    isTriangle,
    isRight: isTriangle && difference <= tolerance,
    left,
    right,
    difference,
  };
}

function tutorFeedback(values, analysis) {
  if (!values.every((value) => Number.isFinite(value) && value > 0)) {
    return "Ingresa tres longitudes positivas. Un lado no puede medir cero ni ser negativo.";
  }

  if (!analysis.isTriangle) {
    return "Todavía no hay triángulo: la suma de los dos lados menores debe ser mayor que el lado más largo.";
  }

  if (analysis.isRight) {
    return `Muy bien. Detecté que ${cleanNumber(analysis.hypotenuse)} es el lado mayor, así que lo traté como hipotenusa. La igualdad se cumple.`;
  }

  if (analysis.difference <= 4) {
    return "Estás cerca de un triángulo rectángulo. Ajusta un poco el lado mayor o revisa si redondeaste algún dato.";
  }

  return "Este triángulo existe, pero no es rectángulo. Prueba con ternas como 3-4-5, 5-12-13 o 8-15-17 para ver el patrón.";
}

function renderSteps(analysis) {
  const conclusion = !analysis.isTriangle
    ? "Como no se cumple la desigualdad triangular, estas longitudes no forman un triángulo."
    : analysis.isRight
      ? "Como los resultados coinciden, el triángulo es rectángulo."
      : "Como los resultados no coinciden, el triángulo no es rectángulo.";

  const steps = [
    `Ordenamos los lados: ${analysis.sorted.map(cleanNumber).join(", ")}. El mayor, ${cleanNumber(analysis.hypotenuse)}, es candidato a hipotenusa.`,
    `Comprobamos que sea triángulo: ${cleanNumber(analysis.cathetusA)} + ${cleanNumber(analysis.cathetusB)} debe ser mayor que ${cleanNumber(analysis.hypotenuse)}.`,
    `Elevamos los catetos al cuadrado: ${cleanNumber(analysis.cathetusA)}² = ${cleanNumber(square(analysis.cathetusA))} y ${cleanNumber(analysis.cathetusB)}² = ${cleanNumber(square(analysis.cathetusB))}.`,
    `Sumamos: ${cleanNumber(square(analysis.cathetusA))} + ${cleanNumber(square(analysis.cathetusB))} = ${cleanNumber(analysis.left)}.`,
    `Comparamos con la hipotenusa al cuadrado: ${cleanNumber(analysis.hypotenuse)}² = ${cleanNumber(analysis.right)}.`,
    conclusion,
  ];

  stepList.innerHTML = steps.map((step) => `<li>${step}</li>`).join("");
}

function updateProgress() {
  const currentLevel = Math.min(4, 1 + solvedExercises);
  progressLabel.textContent = `Nivel ${currentLevel}`;
  progressBar.style.width = `${Math.min(100, currentLevel * 25)}%`;
}

function renderAnalysis() {
  const values = readSides();
  const analysis = analyzeTriangle(values);
  const [a, b, c] = values.map((value) => (Number.isFinite(value) ? value : 0));

  labels.a.textContent = `a = ${cleanNumber(a)}`;
  labels.b.textContent = `b = ${cleanNumber(b)}`;
  labels.c.textContent = `c = ${cleanNumber(c)}`;

  formulaLine.textContent = `${cleanNumber(analysis.cathetusA)}² + ${cleanNumber(analysis.cathetusB)}² = ${cleanNumber(analysis.hypotenuse)}²`;

  statusBadge.classList.remove("is-right", "is-invalid", "is-not-right");

  if (!analysis.isTriangle) {
    statusBadge.textContent = "No forma triángulo";
    statusBadge.classList.add("is-invalid");
    resultTitle.textContent = "Revisa las longitudes";
    resultText.textContent = "Para formar un triángulo, los dos lados menores deben sumar más que el lado mayor.";
  } else if (analysis.isRight) {
    statusBadge.textContent = "Triángulo rectángulo";
    statusBadge.classList.add("is-right");
    resultTitle.textContent = `${cleanNumber(analysis.cathetusA)}² + ${cleanNumber(analysis.cathetusB)}² = ${cleanNumber(analysis.hypotenuse)}²`;
    resultText.textContent = `${cleanNumber(analysis.left)} = ${cleanNumber(analysis.right)}. Sí cumple el Teorema de Pitágoras.`;
  } else {
    statusBadge.textContent = "No es rectángulo";
    statusBadge.classList.add("is-not-right");
    resultTitle.textContent = `${cleanNumber(analysis.left)} ≠ ${cleanNumber(analysis.right)}`;
    resultText.textContent = "El triángulo existe, pero sus lados no cumplen a² + b² = c².";
  }

  aiFeedback.textContent = tutorFeedback(values, analysis);
  renderSteps(analysis);
  window.dispatchEvent(new CustomEvent("triangle:update", { detail: { values, analysis } }));
}

function loadExercise() {
  const exercise = exercises[exerciseIndex];
  const feedback = document.querySelector("#exerciseFeedback");
  document.querySelector("#exerciseTitle").textContent = `Ejercicio ${exerciseIndex + 1}`;
  document.querySelector("#exercisePrompt").textContent = `Un triángulo tiene lados ${exercise.sides.join(", ")}. ¿Es rectángulo?`;
  feedback.classList.remove("is-correct", "is-wrong");
  feedback.textContent = "Elige una respuesta para recibir retroalimentación.";
  document.querySelectorAll(".choice").forEach((button) => {
    button.classList.remove("is-correct", "is-wrong");
    button.disabled = false;
  });
}

function buildExerciseFeedback(exercise, selectedAnswer, isCorrect) {
  const analysis = analyzeTriangle(exercise.sides);
  const selectedLabel = selectedAnswer === "yes" ? "Sí" : "No";
  const correctLabel = exercise.answer === "yes" ? "Sí" : "No";
  const conclusion = analysis.isRight
    ? "Sí es rectángulo porque los dos resultados son iguales."
    : "No es rectángulo porque los dos resultados son diferentes.";

  if (isCorrect) {
    return `
      <strong>Correcto.</strong>
      <span>${exercise.explain}</span>
      <span>${conclusion}</span>
    `;
  }

  const errorTip = exercise.answer === "yes"
    ? "Probablemente viste tres números distintos y pensaste que no encajaban. Recuerda: lo importante no es que los lados se parezcan, sino que los cuadrados cumplan la igualdad."
    : "El error común aquí es asumir que cualquier triángulo con un lado más largo es rectángulo. Hay que comprobarlo con los cuadrados.";

  return `
    <strong>Respuesta incorrecta.</strong>
    <span>Elegiste <b>${selectedLabel}</b>, pero la respuesta correcta era <b>${correctLabel}</b>.</span>
    <span>Revisión: ${exercise.explain}</span>
    <span>${conclusion}</span>
    <span class="feedback-tip">${errorTip}</span>
  `;
}

Object.values(sides).forEach((input) => input.addEventListener("input", renderAnalysis));

document.querySelector("#randomBtn").addEventListener("click", () => {
  exampleIndex = (exampleIndex + 1) % examples.length;
  const [a, b, c] = examples[exampleIndex];
  sides.a.value = a;
  sides.b.value = b;
  sides.c.value = c;
  renderAnalysis();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => {
      item.classList.toggle("is-active", item === tab);
      item.setAttribute("aria-selected", item === tab ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === tab.dataset.tab);
    });
  });
});

document.querySelectorAll(".choice").forEach((button) => {
  button.addEventListener("click", () => {
    const exercise = exercises[exerciseIndex];
    const isCorrect = button.dataset.answer === exercise.answer;
    const feedback = document.querySelector("#exerciseFeedback");

    document.querySelectorAll(".choice").forEach((choice) => {
      choice.disabled = true;
      choice.classList.toggle("is-correct", choice.dataset.answer === exercise.answer);
    });

    if (!isCorrect) {
      button.classList.add("is-wrong");
    } else {
      solvedExercises += 1;
      updateProgress();
    }

    feedback.classList.toggle("is-correct", isCorrect);
    feedback.classList.toggle("is-wrong", !isCorrect);
    feedback.innerHTML = buildExerciseFeedback(exercise, button.dataset.answer, isCorrect);
  });
});

document.querySelector("#nextExerciseBtn").addEventListener("click", () => {
  exerciseIndex = (exerciseIndex + 1) % exercises.length;
  loadExercise();
});

renderAnalysis();
loadExercise();
updateProgress();
