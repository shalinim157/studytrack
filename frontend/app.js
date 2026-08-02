// Single-process run mode relative API endpoint base
const API_BASE_URL = "";

// DOM Elements
const rosterList = document.getElementById("roster-list");
const studentForm = document.getElementById("student-form");
const newCourseForm = document.getElementById("new-course-form");
const courseForm = document.getElementById("course-form");
const errorBanner = document.getElementById("error-banner");
const errorMessageEl = document.getElementById("error-message");
const closeErrorBtn = document.getElementById("close-error-btn");
const totalStudentsBadge = document.getElementById("total-students-badge");
const filterBtn = document.getElementById("filter-btn");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const minAgeInput = document.getElementById("min-age-input");

// Dropdowns in Map Course Modal
const courseStudentIdSelect = document.getElementById("course-student-id");
const courseDropdownSelect = document.getElementById("course-dropdown");
const courseCreditsInput = document.getElementById("course-credits");

// Modal Elements
const openStudentModalBtn = document.getElementById("open-student-modal-btn");
const openNewCourseModalBtn = document.getElementById("open-new-course-modal-btn");
const openCourseModalBtn = document.getElementById("open-course-modal-btn");

const studentModal = document.getElementById("student-modal");
const newCourseModal = document.getElementById("new-course-modal");
const courseModal = document.getElementById("course-modal");
const confirmationModal = document.getElementById("confirmation-modal");

const closeStudentModalBtn = document.getElementById("close-student-modal");
const closeNewCourseModalBtn = document.getElementById("close-new-course-modal");
const closeCourseModalBtn = document.getElementById("close-course-modal");
const closeConfirmModalBtn = document.getElementById("close-confirm-modal");
const confirmOkBtn = document.getElementById("confirm-ok-btn");
const confirmModalMessage = document.getElementById("confirm-modal-message");

// State
let allStudents = [];
let availableCoursesSet = new Set([
    "Computer Science 101",
    "Data Structures",
    "Algorithms",
    "Calculus I",
    "Linear Algebra",
    "Web Development",
    "Database Systems",
    "Operating Systems",
    "Physics I",
    "Artificial Intelligence",
    "Machine Learning"
]);

// Course default credits map
const courseCreditsMap = {
    "Computer Science 101": 3,
    "Data Structures": 4,
    "Algorithms": 4,
    "Calculus I": 4,
    "Linear Algebra": 3,
    "Web Development": 3,
    "Database Systems": 3,
    "Operating Systems": 4,
    "Physics I": 4,
    "Artificial Intelligence": 4,
    "Machine Learning": 4
};

/**
 * Display main on-page error banner.
 */
function showError(message) {
    if (errorMessageEl && errorBanner) {
        errorMessageEl.textContent = message;
        errorBanner.classList.remove("hidden");
    }
}

/**
 * Hide main on-page error banner.
 */
function hideError() {
    if (errorBanner) {
        errorBanner.classList.add("hidden");
    }
}

/**
 * Display errors directly inside the active modal popup.
 */
function showModalError(modalEl, message) {
    if (modalEl) {
        const errorDiv = modalEl.querySelector(".modal-error-banner");
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove("hidden");
        }
    }
}

/**
 * Hide error banners in all modal dialogs.
 */
function hideModalErrors() {
    document.querySelectorAll(".modal-error-banner").forEach(el => {
        el.textContent = "";
        el.classList.add("hidden");
    });
}

/**
 * Display confirmation success modal dialog with OK message button.
 */
function showConfirmation(message) {
    if (confirmModalMessage && confirmationModal) {
        confirmModalMessage.textContent = message;
        openModal(confirmationModal);
    }
}

/**
 * Helper functions to open and close modals.
 */
function openModal(modalEl) {
    if (modalEl) {
        hideModalErrors();
        modalEl.classList.remove("hidden");
    }
}

function closeModal(modalEl) {
    if (modalEl) {
        hideModalErrors();
        modalEl.classList.add("hidden");
    }
}

/**
 * Helper to fetch data safely with error handling.
 */
async function fetchAPI(url, options = {}) {
    hideError();
    try {
        const response = await fetch(API_BASE_URL + url, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            let errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
            try {
                const errorJson = await response.json();
                if (errorJson.detail) {
                    if (Array.isArray(errorJson.detail)) {
                        errorDetail = errorJson.detail.map(e => e.msg || e.detail).join("; ");
                    } else {
                        errorDetail = errorJson.detail;
                    }
                }
            } catch (e) {
                // Response wasn't JSON
            }
            throw new Error(errorDetail);
        }

        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        if (error.name === "TypeError" && error.message.includes("fetch")) {
            const sysMsg = "Could not reach the StudyTrack backend. Please ensure the backend server is running.";
            showError(sysMsg);
            throw new Error(sysMsg);
        } else {
            throw error;
        }
    }
}

/**
 * Populate Student and Course dropdown options in the Map Course to Student Modal.
 */
function updateMapModalDropdowns(students) {
    // 1. Populate Student Dropdown
    if (courseStudentIdSelect) {
        const currentSelected = courseStudentIdSelect.value;
        courseStudentIdSelect.innerHTML = '<option value="">-- Select Student --</option>';
        students.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = s.name;
            courseStudentIdSelect.appendChild(option);
        });
        if (currentSelected) courseStudentIdSelect.value = currentSelected;
    }

    // 2. Also collect any existing courses from student records into availableCoursesSet
    students.forEach(s => {
        if (s.courses) {
            s.courses.forEach(c => {
                availableCoursesSet.add(c.course_name);
                if (c.credits) courseCreditsMap[c.course_name] = c.credits;
            });
        }
    });

    // 3. Populate Course Dropdown
    if (courseDropdownSelect) {
        const currentCourseSelected = courseDropdownSelect.value;
        courseDropdownSelect.innerHTML = '<option value="">-- Select Course --</option>';
        Array.from(availableCoursesSet).sort().forEach(courseName => {
            const option = document.createElement("option");
            option.value = courseName;
            option.textContent = courseName;
            courseDropdownSelect.appendChild(option);
        });
        if (currentCourseSelected) courseDropdownSelect.value = currentCourseSelected;
    }
}

/**
 * Automatically set default credits input value when a course is chosen from the dropdown.
 */
if (courseDropdownSelect) {
    courseDropdownSelect.addEventListener("change", () => {
        const selectedCourse = courseDropdownSelect.value;
        if (selectedCourse && courseCreditsMap[selectedCourse]) {
            courseCreditsInput.value = courseCreditsMap[selectedCourse];
        }
    });
}

/**
 * Dynamically builds a single Student Card DOM Element using document.createElement.
 */
function createStudentCardElement(student) {
    const card = document.createElement("div");
    card.className = "student-card";
    card.setAttribute("data-student-id", student.id);

    // Card Header
    const cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    const nameEl = document.createElement("h3");
    nameEl.className = "student-name";
    nameEl.textContent = student.name;

    const idTag = document.createElement("span");
    idTag.className = "student-id-tag";
    idTag.textContent = `ID: #${student.id}`;

    cardHeader.appendChild(nameEl);
    cardHeader.appendChild(idTag);

    // Student Info Section
    const infoSection = document.createElement("div");
    infoSection.className = "student-info";

    const emailRow = document.createElement("div");
    emailRow.className = "info-item";
    emailRow.innerHTML = `<span>📧</span> <span>${student.email}</span>`;

    const ageDisplayRow = document.createElement("div");
    ageDisplayRow.className = "info-item";
    
    const ageText = document.createElement("span");
    ageText.className = "age-text-label";
    ageText.textContent = `🎂 Age: ${student.age}`;
    ageDisplayRow.appendChild(ageText);

    // Inline Age Edit Controls
    const ageEditRow = document.createElement("div");
    ageEditRow.className = "age-edit-row";

    const ageInput = document.createElement("input");
    ageInput.type = "number";
    ageInput.className = "inline-age-input";
    ageInput.value = student.age;
    ageInput.min = "1";
    ageInput.setAttribute("aria-label", "Edit age");

    const saveAgeBtn = document.createElement("button");
    saveAgeBtn.className = "btn btn-save btn-sm save-age-btn";
    saveAgeBtn.setAttribute("data-id", student.id);
    saveAgeBtn.textContent = "Save Age";

    ageEditRow.appendChild(ageInput);
    ageEditRow.appendChild(saveAgeBtn);

    infoSection.appendChild(emailRow);
    infoSection.appendChild(ageDisplayRow);
    infoSection.appendChild(ageEditRow);

    // Enrolled Courses Section
    const coursesSection = document.createElement("div");
    coursesSection.className = "courses-container";

    const coursesTitle = document.createElement("div");
    coursesTitle.className = "courses-title";
    const courseCount = student.courses ? student.courses.length : 0;
    coursesTitle.textContent = `Enrolled Courses (${courseCount})`;

    const courseTags = document.createElement("div");
    courseTags.className = "course-tags";

    if (student.courses && student.courses.length > 0) {
        student.courses.forEach(c => {
            const chip = document.createElement("span");
            chip.className = "course-chip";
            chip.innerHTML = `
                <span>${c.course_name} (${c.credits} cr)</span>
                <button class="remove-course-btn" data-course-id="${c.id}" data-course-name="${c.course_name}" data-student-name="${student.name}" title="Remove course">&times;</button>
            `;
            courseTags.appendChild(chip);
        });
    } else {
        const noCourses = document.createElement("span");
        noCourses.style.fontSize = "0.75rem";
        noCourses.style.color = "var(--text-muted)";
        noCourses.textContent = "No active course enrollments";
        courseTags.appendChild(noCourses);
    }

    coursesSection.appendChild(coursesTitle);
    coursesSection.appendChild(courseTags);

    // Card Actions
    const cardActions = document.createElement("div");
    cardActions.className = "card-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm delete-btn btn-block";
    deleteBtn.setAttribute("data-id", student.id);
    deleteBtn.setAttribute("data-name", student.name);
    deleteBtn.textContent = "🗑️ Delete Student";

    cardActions.appendChild(deleteBtn);

    // Assemble Card
    card.appendChild(cardHeader);
    card.appendChild(infoSection);
    card.appendChild(coursesSection);
    card.appendChild(cardActions);

    return card;
}

/**
 * Renders the roster list by appending dynamically created DOM elements.
 */
function renderRoster(students) {
    rosterList.innerHTML = ""; // Clear container

    if (!students || students.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = "<p>No students found matching current criteria.</p>";
        rosterList.appendChild(emptyState);
        if (totalStudentsBadge) totalStudentsBadge.textContent = "Total Students: 0";
        return;
    }

    students.forEach(student => {
        const cardEl = createStudentCardElement(student);
        rosterList.appendChild(cardEl);
    });

    if (totalStudentsBadge) {
        totalStudentsBadge.textContent = `Total Students: ${students.length}`;
    }
}

/**
 * Load student roster from backend endpoint GET /students/.
 */
async function loadRoster(minAge = null) {
    try {
        let endpoint = "/students/";
        if (minAge !== null && minAge !== "") {
            endpoint += `?min_age=${encodeURIComponent(minAge)}`;
        }
        allStudents = await fetchAPI(endpoint);
        
        // Update student and course dropdown options in Map Course modal
        updateMapModalDropdowns(allStudents);

        renderRoster(allStudents);
    } catch (e) {
        console.error("Failed to load student roster:", e);
    }
}

/**
 * Event Delegation on #roster-list container.
 */
rosterList.addEventListener("click", async (event) => {
    const saveBtn = event.target.closest(".save-age-btn");
    const deleteBtn = event.target.closest(".delete-btn");
    const removeCourseBtn = event.target.closest(".remove-course-btn");

    if (saveBtn) {
        const studentId = saveBtn.getAttribute("data-id");
        const card = saveBtn.closest(".student-card");
        const ageInput = card.querySelector(".inline-age-input");
        const newAge = parseInt(ageInput.value, 10);

        if (isNaN(newAge) || newAge <= 0) {
            showError("Age must be a valid positive number greater than 0.");
            return;
        }

        try {
            const updatedStudent = await fetchAPI(`/students/${studentId}`, {
                method: "PATCH",
                body: JSON.stringify({ age: newAge }),
            });

            const ageLabel = card.querySelector(".age-text-label");
            if (ageLabel) {
                ageLabel.textContent = `🎂 Age: ${updatedStudent.age}`;
            }
            ageInput.value = updatedStudent.age;
            showConfirmation(`Age for ${updatedStudent.name} updated to ${updatedStudent.age}.`);
        } catch (e) {
            showError(e.message || "Failed to update student age.");
        }
    } else if (deleteBtn) {
        const studentId = deleteBtn.getAttribute("data-id");
        const studentName = deleteBtn.getAttribute("data-name") || "Student";
        const card = deleteBtn.closest(".student-card");

        try {
            await fetchAPI(`/students/${studentId}`, {
                method: "DELETE",
            });

            card.remove();
            await loadRoster(minAgeInput ? minAgeInput.value : null);
            showConfirmation(`${studentName} is deleted.`);
        } catch (e) {
            showError(e.message || "Failed to delete student.");
        }
    } else if (removeCourseBtn) {
        const courseId = removeCourseBtn.getAttribute("data-course-id");
        const courseName = removeCourseBtn.getAttribute("data-course-name") || "Course";
        const studentName = removeCourseBtn.getAttribute("data-student-name") || "student";
        
        try {
            await fetchAPI(`/courses/${courseId}`, {
                method: "DELETE",
            });

            await loadRoster(minAgeInput ? minAgeInput.value : null);
            showConfirmation(`Course '${courseName}' has been removed from ${studentName}.`);
        } catch (e) {
            showError(e.message || "Failed to delete course.");
        }
    }
});

/**
 * Form 1: #student-form Submit Handler (Create New Student).
 */
studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideModalErrors();

    const nameInput = document.getElementById("student-name");
    const emailInput = document.getElementById("student-email");
    const ageInput = document.getElementById("student-age");

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const age = parseInt(ageInput.value, 10);

    // Front-end validations matching Pydantic custom validators
    if (!name) {
        showModalError(studentModal, "Student full name is required.");
        return;
    }

    if (!email || !email.includes("@")) {
        showModalError(studentModal, "Invalid email format: Must contain an '@' character.");
        return;
    }

    if (isNaN(age) || age <= 0) {
        showModalError(studentModal, "Age must be a positive integer greater than 0.");
        return;
    }

    try {
        const createdStudent = await fetchAPI("/students/", {
            method: "POST",
            body: JSON.stringify({ name, email, age }),
        });

        // Remove empty state element if present
        const emptyState = rosterList.querySelector(".empty-state");
        if (emptyState) emptyState.remove();

        // Dynamically create & append new card to DOM using document.createElement + appendChild
        const newCardEl = createStudentCardElement(createdStudent);
        rosterList.appendChild(newCardEl);

        // Update state and student dropdown for course mapping
        allStudents.push(createdStudent);
        updateMapModalDropdowns(allStudents);
        if (courseStudentIdSelect && createdStudent && createdStudent.id) {
            courseStudentIdSelect.value = createdStudent.id;
        }

        // Update badge count
        if (totalStudentsBadge) {
            totalStudentsBadge.textContent = `Total Students: ${allStudents.length}`;
        }

        // Reset form & close modal on success
        studentForm.reset();
        closeModal(studentModal);

        // Show confirmation OK popup
        showConfirmation(`Student '${createdStudent.name}' created successfully.`);
    } catch (e) {
        // Display error directly inside student modal popup
        showModalError(studentModal, e.message || "Failed to create student.");
    }
});

/**
 * Form 2: #new-course-form Submit Handler (Create New Course Title - Only Title Input).
 */
if (newCourseForm) {
    newCourseForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hideModalErrors();

        const titleInput = document.getElementById("new-course-title");
        const title = titleInput.value.trim();

        if (!title) {
            showModalError(newCourseModal, "Course title is required.");
            return;
        }

        // Add course title to available set with default 3 credits
        availableCoursesSet.add(title);
        courseCreditsMap[title] = 3;

        // Re-populate Course Dropdown in Map Course modal
        updateMapModalDropdowns(allStudents);

        // Reset form & close modal on success
        newCourseForm.reset();
        closeModal(newCourseModal);

        // Show confirmation OK popup
        showConfirmation(`Course '${title}' created successfully.`);
    });
}

/**
 * Form 3: #course-form Submit Handler (Map Course to Student).
 */
if (courseForm) {
    courseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideModalErrors();

        const studentIdVal = courseStudentIdSelect.value;
        const courseName = courseDropdownSelect.value.trim();
        const creditsVal = courseCreditsInput.value;

        if (!studentIdVal) {
            showModalError(courseModal, "Please select a student from the dropdown.");
            return;
        }

        if (!courseName) {
            showModalError(courseModal, "Please select a course title from the dropdown.");
            return;
        }

        const studentId = parseInt(studentIdVal, 10);
        const credits = parseInt(creditsVal, 10);

        if (isNaN(credits) || credits < 1 || credits > 6) {
            showModalError(courseModal, "Course credits must be an integer between 1 and 6 inclusive.");
            return;
        }

        // Retrieve selected student name for confirmation popup
        const selectedStudentOption = courseStudentIdSelect.options[courseStudentIdSelect.selectedIndex];
        const studentNameText = selectedStudentOption ? selectedStudentOption.textContent : "Student";

        try {
            await fetchAPI("/courses/", {
                method: "POST",
                body: JSON.stringify({
                    student_id: studentId,
                    course_name: courseName,
                    credits: credits
                }),
            });

            // Reload roster to show newly enrolled course chip and updated course count
            await loadRoster();

            // Clear all form inputs explicitly (student dropdown, course dropdown, and credits input)
            courseForm.reset();
            courseStudentIdSelect.value = "";
            courseDropdownSelect.value = "";
            courseCreditsInput.value = "";

            // Close map course modal on success
            closeModal(courseModal);

            // Show confirmation OK popup
            showConfirmation(`Course '${courseName}' mapped to ${studentNameText} successfully.`);
        } catch (e) {
            // Display error directly inside map course modal popup (e.g. duplicate course for same student)
            showModalError(courseModal, e.message || "Failed to map course to student.");
        }
    });
}

// Modal Event Listeners
if (openStudentModalBtn) {
    openStudentModalBtn.addEventListener("click", () => openModal(studentModal));
}

if (openNewCourseModalBtn) {
    openNewCourseModalBtn.addEventListener("click", () => openModal(newCourseModal));
}

if (openCourseModalBtn) {
    openCourseModalBtn.addEventListener("click", () => openModal(courseModal));
}

if (closeStudentModalBtn) {
    closeStudentModalBtn.addEventListener("click", () => closeModal(studentModal));
}

if (closeNewCourseModalBtn) {
    closeNewCourseModalBtn.addEventListener("click", () => closeModal(newCourseModal));
}

if (closeCourseModalBtn) {
    closeCourseModalBtn.addEventListener("click", () => closeModal(courseModal));
}

if (closeConfirmModalBtn) {
    closeConfirmModalBtn.addEventListener("click", () => closeModal(confirmationModal));
}

if (confirmOkBtn) {
    confirmOkBtn.addEventListener("click", () => closeModal(confirmationModal));
}

// Cancel Buttons inside Modals
document.querySelectorAll(".cancel-modal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-overlay");
        closeModal(modal);
    });
});

// Close Modal when clicking outside modal-content (backdrop click)
window.addEventListener("click", (event) => {
    if (event.target === studentModal) closeModal(studentModal);
    if (event.target === newCourseModal) closeModal(newCourseModal);
    if (event.target === courseModal) closeModal(courseModal);
    if (event.target === confirmationModal) closeModal(confirmationModal);
});

// Close Modal on Escape key
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal(studentModal);
        closeModal(newCourseModal);
        closeModal(courseModal);
        closeModal(confirmationModal);
    }
});

// Filter Event Handlers
filterBtn.addEventListener("click", () => {
    const minAge = minAgeInput.value;
    loadRoster(minAge);
});

clearFilterBtn.addEventListener("click", () => {
    minAgeInput.value = "";
    loadRoster();
});

// Close Error Banner Handler
if (closeErrorBtn) {
    closeErrorBtn.addEventListener("click", hideError);
}

// Initial Load on Page Startup
document.addEventListener("DOMContentLoaded", () => {
    loadRoster();
});
