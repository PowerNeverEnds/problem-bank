const API_URL =
  "https://script.google.com/macros/s/AKfycbyg24xu-D-rWfhTNx7GQeDaP2Ut8MP8uGNh57gdIhoLtLxbxtd96B5UZHwJfLMsOSem/exec";


let allData = {};
let selectedSubject = "전체";


async function loadData() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("데이터를 불러오지 못했습니다.");
        }

        const data = await response.json();

        allData = data;

        createSubjectButtons(data["시트9"]);

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


function cleanText(text) {
    return String(text ?? "")
        .replace(/\u00A0/g, " ")
        .replace(/\u200B/g, "")
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line !== "")
        .join("\n")
        .trim();
}

/* 과목 버튼 만들기 */
function createSubjectButtons(sheet9) {

    const subjects = [
        ...new Set(
            sheet9
                .map(row => row["과목"])
                .filter(subject => subject)
        )
    ];

    const menu = document.getElementById("subject-menu");

    menu.innerHTML = "";

    /* 전체 버튼 */
    const allButton = document.createElement("button");

    allButton.textContent = "전체";

    allButton.onclick = () => {
        selectedSubject = "전체";
      
        document.getElementById("keyword-menu").innerHTML = "";

        displayProblems(
            allData["시트9"],
            allData["문제DB"],
            allData["해설DB"],
            allData["문제별해설DB"]
        );
    };

    menu.appendChild(allButton);


    /* 과목별 버튼 */
    subjects.forEach(subject => {

        const button = document.createElement("button");

        button.textContent = subject;

        button.onclick = () => {

            selectedSubject = subject;
          
            createKeywordButtons(subject);

            const filtered = allData["시트9"].filter(
                row => row["과목"] === subject
            );

            displayProblems(
                filtered,
                allData["문제DB"],
                allData["해설DB"],
                allData["문제별해설DB"]
            );
        };

        menu.appendChild(button);
    });
}

function createKeywordButtons(subject) {

    const menu = document.getElementById("keyword-menu");

    menu.innerHTML = "";

    const keywordDB = allData["키워드DB"];

    if (!keywordDB) return;

    const keywords = keywordDB.filter(
        row => row["과목"] === subject
    );

    if (keywords.length === 0) {
        return;
    }

    const title = document.createElement("div");
    title.textContent = "키워드";
    menu.appendChild(title);

    keywords.forEach(keyword => {

        const button = document.createElement("button");

        button.textContent = keyword["키워드"];

        button.onclick = () => {
            displayKeyword(
                keyword,
                allData["시트9"],
                allData["문제DB"],
                allData["해설DB"],
                allData["문제별해설DB"]
            );
        };

        menu.appendChild(button);
    });
}

/* 문제 출력 */
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


            <div class="question">${cleanText(problem["문제만"])}</div>


            ${
                problem["사진"]
                ? `
                    <img
                        src="images/${problem["사진"]}"
                        style="max-width:100%; margin-top:15px;"
                    >
                `
                : ""
            }


            <div class="choices">

                <div>① ${cleanText(problem["보기1"])}</div>

                <div>② ${cleanText(problem["보기2"])}</div>

                <div>③ ${cleanText(problem["보기3"])}</div>

                <div>④ ${cleanText(problem["보기4"])}</div>

            </div>


            <div class="answer">
                정답: ${problem["정답"] || ""}
            </div>


            

        `;
        if (explanation) {
            const explanationDiv = document.createElement("div");
            explanationDiv.className = "explanation";

            const title = document.createElement("h3");
            title.textContent = "공통 해설";

            const content = document.createElement("div");
            content.textContent = cleanText(explanation["공통해설"]);

            const tip = document.createElement("div");
            tip.className = "tip";
            tip.textContent = "꿀팁: " + cleanText(explanation["꿀팁"]);

            explanationDiv.appendChild(title);
            explanationDiv.appendChild(content);
            explanationDiv.appendChild(tip);

            div.appendChild(explanationDiv);
        }
        if (individual) {
            const individualDiv = document.createElement("div");
            individualDiv.className = "explanation";

            const title = document.createElement("h3");
            title.textContent = "문제별 해설";

            const content = document.createElement("div");
            content.textContent = cleanText(individual["문제별해설"]);

            individualDiv.appendChild(title);
            individualDiv.appendChild(content);

            div.appendChild(individualDiv);
        }


        container.appendChild(div);

    });
}


loadData();
