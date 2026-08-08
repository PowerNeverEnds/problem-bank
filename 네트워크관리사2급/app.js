const API_URL =
  "https://script.google.com/macros/s/AKfycbyg24xu-D-rWfhTNx7GQeDaP2Ut8MP8uGNh57gdIhoLtLxbxtd96B5UZHwJfLMsOSem/exec";


async function loadData() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("데이터를 불러오지 못했습니다.");
        }

        const data = await response.json();

        displayProblems(
            data["시트9"],
            data["문제DB"],
            data["해설DB"],
            data["문제별해설DB"]
        );

    } catch (error) {
        console.error(error);

        document.getElementById("problem-list").innerHTML =
            "<p>문제를 불러오지 못했습니다.</p>";
    }
}


function displayProblems(
    sheet9,
    problemDB,
    explanationDB,
    individualDB
) {
    const container = document.getElementById("problem-list");

    container.innerHTML = "";

    sheet9.forEach(row => {

        const subject = row["과목"];
        const count = row["횟수"];
        const source = row["출처"];
        const problemID = row["문제ID"];

        const problem = problemDB.find(
            p => String(p["문제ID"]) === String(problemID)
        );

        if (!problem) return;

        const explanation = explanationDB.find(
            e => String(e["해설ID"]) === String(problem["해설ID"])
        );

        const individual = individualDB.find(
            e => String(e["문제ID"]) === String(problemID)
        );

        const div = document.createElement("div");

        div.className = "problem";

        div.innerHTML = `
            <div class="info">
                ${subject} · ${count}회 출제
                <br>
                출처: ${source}
                <br>
                문제ID: ${problemID}
            </div>

            <div class="question">
                ${problem["문제만"] || ""}
            </div>

            ${
                problem["사진"]
                ? `<img src="images/${problem["사진"]}"
                        style="max-width:100%; margin-top:15px;">`
                : ""
            }

            <div class="choices">
                ${problem["보기"] || ""}
            </div>

            <div class="answer">
                정답: ${problem["정답"] || ""}
            </div>

            ${
                explanation
                ? `
                    <div class="explanation">
                        <h3>공통 해설</h3>
                        <div>${explanation["공통해설"] || ""}</div>

                        <div class="tip">
                            꿀팁: ${explanation["꿀팁"] || ""}
                        </div>
                    </div>
                `
                : ""
            }

            ${
                individual
                ? `
                    <div class="explanation">
                        <h3>문제별 해설</h3>
                        <div>${individual["문제별해설"] || ""}</div>
                    </div>
                `
                : ""
            }
        `;

        container.appendChild(div);
    });
}


loadData();
