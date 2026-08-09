const API_URL =
"https://script.google.com/macros/s/AKfycbyg24xu-D-rWfhTNx7GQeDaP2Ut8MP8uGNh57gdIhoLtLxbxtd96B5UZHwJfLMsOSem/exec";


let allData = {};
let selectedSubject = "전체";
let selectedCounts = ["2", "3", "4"];
let selectedKeyword = null;


/* =========================
데이터 불러오기
========================= */


async function loadData() {


try {

    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("데이터를 불러오지 못했습니다.");
    }

    const data = await response.json();

    allData = data;

    createSubjectButtons(data["시트9"]);
    createCountFilter();

    updateCountCheckboxes();

    refreshProblems();

} catch (error) {

    console.error(error);

    document.getElementById("problem-list").innerHTML =
        "<p>문제를 불러오지 못했습니다.</p>";

}



}


/* =========================
텍스트 정리
========================= */


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


/* =========================
키워드 이론 출력
[[IMG:파일명.png]]
========================= */


function renderTheory(text) {


let html = cleanText(text);

html = html.replace(
    /\[IMG:([^]+)\]\]/g,
    (match, filename) => {

        return `
            <img
                src="images/${filename}"
                style="max-width:100%; margin:15px 0;"
                alt="${filename}"
            >
        `;

    }
);

html = html.replace(/\n/g, "<br>");

return html;



}


/* =========================
과목 버튼 만들기
========================= */


function createSubjectButtons(sheet9) {


const subjects = [
    ...new Set(
        sheet9
            .map(row => row["과목"])
            .filter(subject => subject)
    )
];

const menu =
    document.getElementById("subject-menu");

menu.innerHTML = "";


/* 전체 */

const allButton =
    document.createElement("button");

allButton.textContent = "전체";

allButton.onclick = () => {

    selectedSubject = "전체";
    selectedKeyword = null;

    document.getElementById(
        "keyword-menu"
    ).innerHTML = "";

    selectedCounts = ["2", "3", "4"];

    updateCountCheckboxes();

    refreshProblems();

};

menu.appendChild(allButton);


/* 과목별 */

subjects.forEach(subject => {

    const button =
        document.createElement("button");

    button.textContent = subject;

    button.onclick = () => {

        selectedSubject = subject;
        selectedKeyword = null;

        selectedCounts = ["2", "3", "4"];

        updateCountCheckboxes();

        createKeywordButtons(subject);

        refreshProblems();

    };

    menu.appendChild(button);

});



}


/* =========================
출제 횟수 필터
========================= */


function createCountFilter() {


const container =
    document.getElementById("count-filter");

const checkboxes =
    container.querySelectorAll(
        'input[type="checkbox"]'
    );

checkboxes.forEach(checkbox => {

    checkbox.addEventListener(
        "change",
        () => {

            /* 전체 */

            if (checkbox.value === "all") {

                if (checkbox.checked) {

                    checkboxes.forEach(cb => {

                        cb.checked =
                            cb.value === "all";

                    });

                    selectedCounts = ["all"];

                } else {

                    const othersChecked =
                        [...checkboxes].some(
                            cb =>
                                cb.value !== "all" &&
                                cb.checked
                        );

                    if (!othersChecked) {

                        checkbox.checked = true;

                        selectedCounts = ["all"];

                    }

                }

            }

            /* 개별 횟수 */

            else {

                const checked =
                    [...checkboxes]
                        .filter(
                            cb =>
                                cb.value !== "all" &&
                                cb.checked
                        )
                        .map(
                            cb => cb.value
                        );

                if (checked.length === 0) {

                    checkboxes.forEach(cb => {

                        cb.checked =
                            cb.value === "all";

                    });

                    selectedCounts = ["all"];

                } else {

                    checkboxes.forEach(cb => {

                        if (cb.value === "all") {
                            cb.checked = false;
                        }

                    });

                    selectedCounts = checked;

                }

            }

            refreshProblems();

        }
    );

});



}


/* =========================
체크박스 화면 업데이트
========================= */


function updateCountCheckboxes() {


const checkboxes =
    document.querySelectorAll(
        '#count-filter input[type="checkbox"]'
    );

checkboxes.forEach(cb => {

    if (selectedCounts.includes("all")) {

        cb.checked =
            cb.value === "all";

    } else {

        cb.checked =
            selectedCounts.includes(
                cb.value
            );

    }

});



}


/* =========================
문제 필터링
========================= */


function refreshProblems() {


let filtered =
    allData["시트9"];


/* =========================
   과목 필터
   ========================= */

if (selectedSubject !== "전체") {

    filtered =
        filtered.filter(
            row =>
                row["과목"] ===
                selectedSubject
        );

}


/* =========================
   출제 횟수 필터
   ========================= */

if (!selectedCounts.includes("all")) {

    filtered =
        filtered.filter(row => {

            const count =
                Number(row["횟수"]);

            return selectedCounts.some(
                value => {

                    if (value === "4") {
                        return count >= 4;
                    }

                    return count ===
                        Number(value);

                }
            );

        });

}


/* =========================
   키워드 필터
   ========================= */

if (selectedKeyword) {

    const keywordProblemIDs =
        allData["문제DB"]
            .filter(problem => {

                const ids =
                    String(
                        problem["키워드ID"] || ""
                    )
                    .split(",")
                    .map(
                        id => id.trim()
                    );

                return ids.includes(
                    String(
                        selectedKeyword
                    ).trim()
                );

            })
            .map(
                problem =>
                    String(
                        problem["문제ID"]
                    )
            );


    filtered =
        filtered.filter(row =>
            keywordProblemIDs.includes(
                String(
                    row["문제ID"]
                )
            )
        );

}


/* =========================
   출력
   ========================= */

if (selectedKeyword) {

    const keyword =
        allData["키워드DB"].find(
            row =>
                String(
                    row["키워드ID"]
                ).trim() ===
                String(
                    selectedKeyword
                ).trim()
        );


    if (keyword) {

        displayKeywordPage(
            keyword,
            filtered,
            allData["문제DB"],
            allData["해설DB"],
            allData["문제별해설DB"]
        );

    }

} else {

    displayProblems(
        filtered,
        allData["문제DB"],
        allData["해설DB"],
        allData["문제별해설DB"]
    );

}



}


/* =========================
키워드 버튼
========================= */


function createKeywordButtons(subject) {


const menu =
    document.getElementById(
        "keyword-menu"
    );

menu.innerHTML = "";


const keywordDB =
    allData["키워드DB"];


if (!keywordDB) return;


const keywords =
    keywordDB.filter(
        row =>
            row["과목"] === subject
    );


if (keywords.length === 0) return;


const title =
    document.createElement("div");

title.textContent = "키워드";

menu.appendChild(title);


keywords.forEach(keyword => {

    const button =
        document.createElement("button");

    button.textContent =
        keyword["키워드"];


    button.onclick = () => {

        selectedKeyword =
            String(
                keyword["키워드ID"]
            ).trim();


        /*
         * 키워드를 처음 누르면
         * 전체 횟수로 시작
         */

        selectedCounts = ["all"];

        updateCountCheckboxes();

        refreshProblems();

    };


    menu.appendChild(button);

});



}


/* =========================
키워드 페이지
========================= */


function displayKeywordPage(
keyword,
sheet9,
problemDB,
explanationDB,
individualDB
) {


const container =
    document.getElementById(
        "problem-list"
    );

container.innerHTML = "";


/* =========================
   이론
   ========================= */

const theory =
    document.createElement("div");

theory.className =
    "explanation";


const title =
    document.createElement("h2");

title.textContent =
    keyword["키워드"];


const content =
    document.createElement("div");

content.className =
    "keyword-theory";


content.innerHTML =
    renderTheory(
        keyword["이론내용"] || ""
    );


theory.appendChild(title);
theory.appendChild(content);

container.appendChild(theory);


/* =========================
   관련 문제
   ========================= */

displayProblems(
    sheet9,
    problemDB,
    explanationDB,
    individualDB
);



}


/* =========================
문제 출력
========================= */


function displayProblems(
sheet9,
problemDB,
explanationDB,
individualDB
) {


const container =
    document.getElementById(
        "problem-list"
    );

/*
 * 키워드 페이지에서는
 * 이미 이론이 들어있으므로
 * 문제만 이어 붙임.
 *
 * 일반 페이지에서는
 * 기존 내용을 초기화.
 */

if (!selectedKeyword) {
    container.innerHTML = "";
}


sheet9.forEach(row => {

    const subject =
        row["과목"];

    const count =
        row["횟수"];

    const source =
        row["출처"];

    const problemID =
        row["문제ID"];


    const problem =
        problemDB.find(
            p =>
                String(
                    p["문제ID"]
                ) ===
                String(problemID)
        );


    if (!problem) return;


    const explanation =
        explanationDB.find(
            e =>
                String(
                    e["해설ID"]
                ) ===
                String(
                    problem["해설ID"]
                )
        );


    const individual =
        individualDB.find(
            e =>
                String(
                    e["문제ID"]
                ) ===
                String(problemID)
        );


    const div =
        document.createElement("div");

    div.className =
        "problem";


    /*
     * 문제 기본 내용
     *
     * 템플릿 안에 불필요한
     * 줄바꿈/들여쓰기를 넣지 않음.
     */

    div.innerHTML = `




${subject} · ${count}회 출제


출처: ${source}


문제ID: ${problemID}



${cleanText(problem["문제만"])}


${
problem["사진"]
? `
<img
src="images/${problem["사진"]}"
style="max-width:100%; margin-top:15px;"






`
: ""
}




① ${cleanText(problem["보기1"])}


② ${cleanText(problem["보기2"])}


③ ${cleanText(problem["보기3"])}


④ ${cleanText(problem["보기4"])}





정답: ${problem["정답"] || ""}


`;

    /* =========================
       공통 해설
       ========================= */

    if (explanation) {

        const explanationDiv =
            document.createElement(
                "div"
            );

        explanationDiv.className =
            "explanation";


        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            "공통 해설";


        const content =
            document.createElement(
                "div"
            );

        content.textContent =
            cleanText(
                explanation["공통해설"]
            );


        const tip =
            document.createElement(
                "div"
            );

        tip.className =
            "tip";


        tip.textContent =
            "꿀팁: " +
            cleanText(
                explanation["꿀팁"]
            );


        explanationDiv.appendChild(
            title
        );

        explanationDiv.appendChild(
            content
        );

        explanationDiv.appendChild(
            tip
        );


        div.appendChild(
            explanationDiv
        );

    }


    /* =========================
       문제별 해설
       ========================= */

    if (individual) {

        const individualDiv =
            document.createElement(
                "div"
            );

        individualDiv.className =
            "explanation";


        const title =
            document.createElement(
                "h3"
            );

        title.textContent =
            "문제별 해설";


        const content =
            document.createElement(
                "div"
            );

        content.textContent =
            cleanText(
                individual["문제별해설"]
            );


        individualDiv.appendChild(
            title
        );

        individualDiv.appendChild(
            content
        );


        div.appendChild(
            individualDiv
        );

    }


    container.appendChild(
        div
    );

});



}


/* =========================
시작
========================= */


loadData();

