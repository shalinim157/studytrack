// Universal API Base URL: Uses relative URL if served from port 8000, otherwise falls back to http://127.0.0.1:8000
const API_BASE_URL = (window.location.origin && window.location.origin.includes(":8000"))
    ? ""
    : "http://127.0.0.1:8000";

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
const newCourseStudentIdSelect = document.getElementById("new-course-student-id");
const newCourseCreditsInput = document.getElementById("new-course-credits");

// Modal Elements
const openStudentModalBtn = document.getElementById("open-student-modal-btn");
const openNewCourseModalBtn = document.getElementById("open-new-course-modal-btn");
const openCourseModalBtn = document.getElementById("open-course-modal-btn");

const studentModal = document.getElementById("student-modal");
const newCourseModal = document.getElementById("new-course-modal");
const courseModal = document.getElementById("course-modal");
const editStudentModal = document.getElementById("edit-student-modal");
const updateCourseModal = document.getElementById("update-course-modal");
const confirmationModal = document.getElementById("confirmation-modal");

const closeStudentModalBtn = document.getElementById("close-student-modal");
const closeNewCourseModalBtn = document.getElementById("close-new-course-modal");
const closeCourseModalBtn = document.getElementById("close-course-modal");
const closeEditStudentModalBtn = document.getElementById("close-edit-student-modal");
const closeUpdateCourseModalBtn = document.getElementById("close-update-course-modal");
const closeConfirmModalBtn = document.getElementById("close-confirm-modal");
const confirmOkBtn = document.getElementById("confirm-ok-btn");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const editStudentForm = document.getElementById("edit-student-form");
const updateCourseForm = document.getElementById("update-course-form");
const newCourseModalListContainer = document.getElementById("new-course-modal-list-container");

// State
let allStudents = [];
let availableCoursesSet = new Set();
const courseCreditsMap = {};

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
    // 1. Populate Student Dropdown in Map Course modal
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

    // 1b. Populate Student Dropdown in New Course modal
    if (newCourseStudentIdSelect) {
        const currentSelected = newCourseStudentIdSelect.value;
        newCourseStudentIdSelect.innerHTML = '<option value="">-- Select Student --</option>';
        students.forEach(s => {
            const option = document.createElement("option");
            option.value = s.id;
            option.textContent = s.name;
            newCourseStudentIdSelect.appendChild(option);
        });
        if (currentSelected) newCourseStudentIdSelect.value = currentSelected;
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
    cardActions.style.display = "flex";
    cardActions.style.gap = "0.5rem";

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary btn-sm edit-student-btn";
    editBtn.style.flex = "1";
    editBtn.setAttribute("data-id", student.id);
    editBtn.setAttribute("data-name", student.name);
    editBtn.setAttribute("data-email", student.email);
    editBtn.setAttribute("data-age", student.age);
    editBtn.textContent = "✏️ Edit";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-danger btn-sm delete-btn";
    deleteBtn.style.flex = "1";
    deleteBtn.setAttribute("data-id", student.id);
    deleteBtn.setAttribute("data-name", student.name);
    deleteBtn.textContent = "🗑️ Delete";

    cardActions.appendChild(editBtn);
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
    const container = document.getElementById("roster-list") || rosterList;
    if (!container) return;
    container.innerHTML = ""; // Clear container

    const badge = document.getElementById("total-students-badge") || totalStudentsBadge;

    if (!students || students.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.innerHTML = "<p>No students found matching current criteria.</p>";
        container.appendChild(emptyState);
        if (badge) badge.textContent = "Total Students: 0";
        return;
    }

    students.forEach(student => {
        const cardEl = createStudentCardElement(student);
        container.appendChild(cardEl);
    });

    if (badge) {
        badge.textContent = `Total Students: ${students.length}`;
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
    const editBtn = event.target.closest(".edit-student-btn");
    const saveBtn = event.target.closest(".save-age-btn");
    const deleteBtn = event.target.closest(".delete-btn");
    const removeCourseBtn = event.target.closest(".remove-course-btn");

    if (editBtn) {
        const studentId = editBtn.getAttribute("data-id");
        const name = editBtn.getAttribute("data-name");
        const email = editBtn.getAttribute("data-email");
        const age = editBtn.getAttribute("data-age");

        document.getElementById("edit-student-id").value = studentId;
        document.getElementById("edit-student-name").value = name;
        document.getElementById("edit-student-email").value = email;
        document.getElementById("edit-student-age").value = age;

        openModal(editStudentModal);
    } else if (saveBtn) {
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
 * Form: #edit-student-form Submit Handler (PATCH /students/{student_id}).
 */
if (editStudentForm) {
    editStudentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideModalErrors();

        const studentId = document.getElementById("edit-student-id").value;
        const name = document.getElementById("edit-student-name").value.trim();
        const email = document.getElementById("edit-student-email").value.trim();
        const ageVal = document.getElementById("edit-student-age").value;
        const age = parseInt(ageVal, 10);

        if (!name || !email || isNaN(age) || age <= 0) {
            showModalError(editStudentModal, "Please provide valid student details.");
            return;
        }

        try {
            const updated = await fetchAPI(`/students/${studentId}`, {
                method: "PATCH",
                body: JSON.stringify({ name, email, age }),
            });

            closeModal(editStudentModal);
            await loadRoster(minAgeInput ? minAgeInput.value : null);
            showConfirmation(`Student '${updated.name}' updated successfully.`);
        } catch (e) {
            showModalError(editStudentModal, e.message || "Failed to update student.");
        }
    });
}

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
 * Form 2: #new-course-form Submit Handler (Add Course Name).
 */
if (newCourseForm) {
    newCourseForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hideModalErrors();

        const titleInput = document.getElementById("new-course-title");
        const title = titleInput ? titleInput.value.trim() : "";

        if (!title) {
            showModalError(newCourseModal, "Course name is required.");
            return;
        }

        // Check if course already exists (case-insensitive)
        const isDuplicate = Array.from(availableCoursesSet).some(c => c.toLowerCase() === title.toLowerCase());
        if (isDuplicate) {
            showModalError(newCourseModal, `Course '${title}' already exists. Please enter a unique course name.`);
            return;
        }

        // Register course title with default 3 credits
        availableCoursesSet.add(title);
        courseCreditsMap[title] = 3;

        // Re-populate Course Dropdown in Map Course modal
        updateMapModalDropdowns(allStudents);

        // Refresh unique existing courses list inside New Course modal
        renderExistingCoursesInNewCourseModal();

        // Reset form on success
        newCourseForm.reset();

        // Close new course modal on success
        closeModal(newCourseModal);

        // Show confirmation OK popup
        showConfirmation(`Course '${title}' added successfully.`);
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

        // Retrieve selected student and check if already enrolled in this course
        const selectedStudent = allStudents.find(s => s.id === studentId);
        if (selectedStudent && selectedStudent.courses) {
            const alreadyEnrolled = selectedStudent.courses.some(c => c.course_name.toLowerCase() === courseName.toLowerCase());
            if (alreadyEnrolled) {
                showModalError(courseModal, `Student '${selectedStudent.name}' is already enrolled in '${courseName}'. A student cannot be enrolled in the same course twice.`);
                return;
            }
        }

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

/**
 * Render all existing unique courses inside the Create New Course modal (without ID column).
 */
async function renderExistingCoursesInNewCourseModal() {
    if (!newCourseModalListContainer) return;

    let dbCourses = [];
    try {
        dbCourses = await fetchAPI("/courses/");
        if (dbCourses && Array.isArray(dbCourses)) {
            dbCourses.forEach(c => {
                availableCoursesSet.add(c.course_name);
                if (c.credits) courseCreditsMap[c.course_name] = c.credits;
            });
        }
    } catch (e) {
        // Fall back to local set if API fails
    }

    const uniqueCourseNames = Array.from(availableCoursesSet).sort();

    if (uniqueCourseNames.length === 0) {
        newCourseModalListContainer.innerHTML = '<p class="text-muted">No course names found.</p>';
        return;
    }

    let tableHtml = `
        <table class="algo-table">
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    uniqueCourseNames.forEach(name => {
        tableHtml += `
            <tr>
                <td><strong>${name}</strong></td>
                <td>
                    <div style="display: flex; gap: 0.4rem;">
                        <button type="button" class="btn btn-secondary btn-sm update-course-name-btn" data-course-name="${name}">
                            ✏️ Update
                        </button>
                        <button type="button" class="btn btn-danger btn-sm delete-course-name-btn" data-course-name="${name}">
                            🗑️ Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    newCourseModalListContainer.innerHTML = tableHtml;
}

// Event Delegation on #new-course-modal-list-container for updating or deleting a course
if (newCourseModalListContainer) {
    newCourseModalListContainer.addEventListener("click", async (event) => {
        const updateBtn = event.target.closest(".update-course-name-btn");
        const deleteBtn = event.target.closest(".delete-course-name-btn");

        if (updateBtn) {
            const courseName = updateBtn.getAttribute("data-course-name");
            if (!courseName) return;

            document.getElementById("old-course-name").value = courseName;
            document.getElementById("new-course-name-input").value = courseName;
            openModal(updateCourseModal);
        } else if (deleteBtn) {
            const courseName = deleteBtn.getAttribute("data-course-name");
            if (!courseName) return;

            try {
                // Fetch all matching course enrollments from the database to get their course IDs
                const dbCourses = await fetchAPI("/courses/");
                const matching = (dbCourses && Array.isArray(dbCourses))
                    ? dbCourses.filter(c => c.course_name.toLowerCase() === courseName.toLowerCase())
                    : [];

                // Delete each course enrollment by its course_id using DELETE /courses/{course_id}
                if (matching.length > 0) {
                    for (const c of matching) {
                        await fetchAPI(`/courses/${c.id}`, {
                            method: "DELETE",
                        });
                    }
                }

                // Remove from local sets
                availableCoursesSet.delete(courseName);
                delete courseCreditsMap[courseName];

                // Reload roster so deleted course is unmapped from student cards immediately
                await loadRoster(minAgeInput ? minAgeInput.value : null);
                updateMapModalDropdowns(allStudents);

                // Refresh existing courses list in modal
                await renderExistingCoursesInNewCourseModal();

                // Close new course modal on deletion
                closeModal(newCourseModal);

                showConfirmation(`Course '${courseName}' deleted successfully.`);
            } catch (e) {
                showModalError(newCourseModal, e.message || "Failed to delete course.");
            }
        }
    });
}

/**
 * Form: #update-course-form Submit Handler (PATCH /courses/{course_id}).
 */
if (updateCourseForm) {
    updateCourseForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        hideModalErrors();

        const oldName = document.getElementById("old-course-name").value.trim();
        const newName = document.getElementById("new-course-name-input").value.trim();

        if (!newName) {
            showModalError(updateCourseModal, "Please enter a valid course name.");
            return;
        }

        try {
            // Find all matching course enrollments from SQLite database
            const dbCourses = await fetchAPI("/courses/");
            const matching = (dbCourses && Array.isArray(dbCourses))
                ? dbCourses.filter(c => c.course_name.toLowerCase() === oldName.toLowerCase())
                : [];

            // Update each course enrollment in-place by its exact ID using PATCH /courses/{course_id}
            if (matching.length > 0) {
                for (const c of matching) {
                    await fetchAPI(`/courses/${c.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ course_name: newName }),
                    });
                }
            }

            // Update local state sets and maps in-place
            availableCoursesSet.delete(oldName);
            availableCoursesSet.add(newName);
            if (courseCreditsMap[oldName]) {
                courseCreditsMap[newName] = courseCreditsMap[oldName];
                delete courseCreditsMap[oldName];
            }

            closeModal(updateCourseModal);
            closeModal(newCourseModal);
            await loadRoster(minAgeInput ? minAgeInput.value : null);
            updateMapModalDropdowns(allStudents);
            await renderExistingCoursesInNewCourseModal();

            showConfirmation(`Course '${oldName}' updated to '${newName}' successfully.`);
        } catch (e) {
            showModalError(updateCourseModal, e.message || "Failed to update course name.");
        }
    });
}

// Modal Event Listeners
if (openStudentModalBtn) {
    openStudentModalBtn.addEventListener("click", () => openModal(studentModal));
}

if (openNewCourseModalBtn) {
    openNewCourseModalBtn.addEventListener("click", () => {
        openModal(newCourseModal);
        renderExistingCoursesInNewCourseModal();
    });
}

if (openCourseModalBtn) {
    openCourseModalBtn.addEventListener("click", () => openModal(courseModal));
}

if (closeStudentModalBtn) {
    closeStudentModalBtn.addEventListener("click", () => closeModal(studentModal));
}

if (closeEditStudentModalBtn) {
    closeEditStudentModalBtn.addEventListener("click", () => closeModal(editStudentModal));
}

if (closeNewCourseModalBtn) {
    closeNewCourseModalBtn.addEventListener("click", () => closeModal(newCourseModal));
}

if (closeUpdateCourseModalBtn) {
    closeUpdateCourseModalBtn.addEventListener("click", () => closeModal(updateCourseModal));
}

if (closeCourseModalBtn) {
    closeCourseModalBtn.addEventListener("click", () => closeModal(courseModal));
}

if (closeConfirmModalBtn) {
    closeConfirmModalBtn.addEventListener("click", () => closeModal(confirmationModal));
}

if (confirmOkBtn) {
    confirmOkBtn.addEventListener("click", () => {
        closeModal(confirmationModal);
        closeModal(newCourseModal);
        closeModal(studentModal);
        closeModal(editStudentModal);
        closeModal(updateCourseModal);
        closeModal(courseModal);
    });
}

// Cancel Buttons inside Modals
document.querySelectorAll(".cancel-modal-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-overlay");
        closeModal(modal);
    });
});

// Tab Component Switching
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const targetTabId = btn.getAttribute("data-tab");
        
        tabButtons.forEach(b => b.classList.remove("active"));
        tabContents.forEach(c => c.classList.add("hidden"));

        btn.classList.add("active");
        const targetContent = document.getElementById(targetTabId);
        if (targetContent) {
            targetContent.classList.remove("hidden");
        }
    });
});

// Part 2 DOM Elements
const sortBySelect = document.getElementById("sort-by-select");
const runSortBtn = document.getElementById("run-sort-btn");
const sortResultsContainer = document.getElementById("sort-results-container");

const searchNameInput = document.getElementById("search-name-input");
const runSearchBtn = document.getElementById("run-search-btn");
const searchResultsContainer = document.getElementById("search-results-container");

const reportMinAgeInput = document.getElementById("report-min-age-input");
const runReportBtn = document.getElementById("run-report-btn");
const reportCountBadge = document.getElementById("report-count-badge");
const reportResultsContainer = document.getElementById("report-results-container");
const reportOutputText = document.getElementById("report-output-text");

// Part 2 Handler 1: Run Insertion Sort (GET /students/sorted?by=field)
if (runSortBtn && sortBySelect) {
    runSortBtn.addEventListener("click", async () => {
        const field = sortBySelect.value || "age";
        try {
            const sortedStudents = await fetchAPI(`/students/sorted?by=${encodeURIComponent(field)}`);
            
            // Update Part 1 Roster list so Part 1 tab reflects the sorted order
            renderRoster(sortedStudents);

            // Render sorted results cleanly inside Part 2 Tab Card as an HTML Table
            if (sortResultsContainer) {
                let tableHtml = `
                    <table class="algo-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Email</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                sortedStudents.forEach(s => {
                    tableHtml += `
                        <tr>
                            <td><strong>${s.name}</strong></td>
                            <td>${s.age}</td>
                            <td>${s.email}</td>
                        </tr>
                    `;
                });
                tableHtml += `</tbody></table>`;
                sortResultsContainer.innerHTML = tableHtml;
            }
        } catch (e) {
            if (sortResultsContainer) {
                sortResultsContainer.innerHTML = `<p class="error-text">❌ ${e.message || "Failed to execute Insertion Sort."}</p>`;
            }
        }
    });
}

// Part 2 Handler 2: Binary Search by Name (GET /students/search?name=exact)
if (runSearchBtn && searchNameInput) {
    runSearchBtn.addEventListener("click", async () => {
        const searchName = searchNameInput.value.trim();
        if (!searchName) {
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `<p class="error-text">⚠️ Please enter an exact student name to perform Binary Search.</p>`;
            }
            return;
        }

        try {
            const matchedStudent = await fetchAPI(`/students/search?name=${encodeURIComponent(searchName)}`);
            
            if (searchResultsContainer) {
                const courseNames = matchedStudent.courses && matchedStudent.courses.length > 0
                    ? matchedStudent.courses.map(c => `${c.course_name} (${c.credits} cr)`).join(", ")
                    : "None";

                searchResultsContainer.innerHTML = `
                    <div class="search-match-card">
                        <span class="match-badge">✅ Student Found</span>
                        <table class="algo-table">
                            <tbody>
                                <tr>
                                    <th>Name</th>
                                    <td><strong>${matchedStudent.name}</strong></td>
                                </tr>
                                <tr>
                                    <th>Age</th>
                                    <td>${matchedStudent.age}</td>
                                </tr>
                                <tr>
                                    <th>Email</th>
                                    <td>${matchedStudent.email}</td>
                                </tr>
                                <tr>
                                    <th>Enrolled Courses</th>
                                    <td>${courseNames}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
            }
        } catch (e) {
            if (searchResultsContainer) {
                searchResultsContainer.innerHTML = `
                    <div class="search-match-card error">
                        <span class="match-badge error">❌ Student Not Found</span>
                        <p>${e.message || `Student '${searchName}' not found in roster.`}</p>
                    </div>
                `;
            }
        }
    });
}

// Part 2 Handler 3: Generate Roster Report (GET /students/report?min_age=n)
if (runReportBtn && reportMinAgeInput) {
    runReportBtn.addEventListener("click", async () => {
        const minAgeVal = parseInt(reportMinAgeInput.value, 10) || 21;
        try {
            const reportData = await fetchAPI(`/students/report?min_age=${minAgeVal}`);
            const studentsList = await fetchAPI("/students/");
            
            // Filter to ONLY students meeting age >= minAgeVal
            const matchingStudents = studentsList.filter(s => s.age >= minAgeVal);

            if (reportCountBadge) {
                reportCountBadge.textContent = `Students Aged ≥ ${minAgeVal}: ${reportData.count_meeting_min_age}`;
                reportCountBadge.classList.remove("hidden");
            }

            if (reportResultsContainer) {
                if (!matchingStudents || matchingStudents.length === 0) {
                    reportResultsContainer.innerHTML = `<p class="text-muted">No student ages ${minAgeVal} or older found in the roster.</p>`;
                } else {
                    let tableHtml = `
                        <table class="algo-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Email</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    studentsList.forEach(s => {
                        const isMatch = s.age >= minAgeVal;
                        const nameHtml = isMatch
                            ? `<span class="highlight-green">${s.name}</span>`
                            : `<span>${s.name}</span>`;

                        tableHtml += `
                            <tr class="${isMatch ? 'row-highlight-green' : ''}">
                                <td>${nameHtml}</td>
                                <td>${s.age}</td>
                                <td>${s.email}</td>
                            </tr>
                        `;
                    });

                    tableHtml += `</tbody></table>`;
                    reportResultsContainer.innerHTML = tableHtml;
                }
                reportResultsContainer.classList.remove("hidden");
            }
        } catch (e) {
            showError(e.message || "Failed to generate roster report.");
        }
    });
}

// Close Modal when clicking outside modal-content (backdrop click)
window.addEventListener("click", (event) => {
    if (event.target === studentModal) closeModal(studentModal);
    if (event.target === editStudentModal) closeModal(editStudentModal);
    if (event.target === newCourseModal) closeModal(newCourseModal);
    if (event.target === updateCourseModal) closeModal(updateCourseModal);
    if (event.target === courseModal) closeModal(courseModal);
    if (event.target === confirmationModal) closeModal(confirmationModal);
});

// Close Modal on Escape key
window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeModal(studentModal);
        closeModal(editStudentModal);
        closeModal(newCourseModal);
        closeModal(updateCourseModal);
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

// --- Part 3: AI Assistant Handlers ---
const aiNotesTextarea = document.getElementById("ai-notes-textarea");
const aiSummarizeBtn = document.getElementById("ai-summarize-btn");
const aiSummarizeResults = document.getElementById("ai-summarize-results");

const aiSearchQueryInput = document.getElementById("ai-search-query-input");
const aiSearchBtn = document.getElementById("ai-search-btn");
const aiSearchResults = document.getElementById("ai-search-results");

// Part 3 Handler 1: Note Summarizer (POST /assistant/summarize)
if (aiSummarizeBtn && aiNotesTextarea && aiSummarizeResults) {
    const handleSummarize = async () => {
        const rawText = aiNotesTextarea.value || "";
        aiSummarizeResults.innerHTML = `<p class="text-muted">⏳ Summarizing notes...</p>`;
        try {
            const summary = await fetchAPI("/assistant/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: rawText })
            });

            const diffBadgeClass = summary.difficulty === "easy" 
                ? "badge-green" 
                : (summary.difficulty === "medium" ? "badge-blue" : "badge-purple");

            const keyPointsHtml = summary.key_points && summary.key_points.length > 0
                ? `<ul style="margin: 0.5rem 0 0 1.25rem; padding: 0;">${summary.key_points.map(kp => `<li style="margin-bottom: 0.25rem;">${kp}</li>`).join("")}</ul>`
                : `<p class="text-muted">No key points extracted.</p>`;

            aiSummarizeResults.innerHTML = `
                <div class="search-match-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; font-size: 1.05rem;">Topic: ${summary.topic}</h4>
                        <span class="badge ${diffBadgeClass}">Difficulty: ${summary.difficulty.toUpperCase()}</span>
                    </div>
                    <div style="margin-top: 0.5rem;">
                        <strong>Key Points:</strong>
                        ${keyPointsHtml}
                    </div>
                </div>
            `;
        } catch (e) {
            aiSummarizeResults.innerHTML = `<p class="error-text">❌ ${e.message || "Failed to generate note summary."}</p>`;
        }
    };

    aiSummarizeBtn.addEventListener("click", handleSummarize);
}

// Part 3 Handler 2: Semantic Search (GET /assistant/search?query=...)
if (aiSearchBtn && aiSearchQueryInput && aiSearchResults) {
    const handleSearch = async () => {
        const query = aiSearchQueryInput.value || "";
        aiSearchResults.innerHTML = `<p class="text-muted">⏳ Searching notes...</p>`;
        try {
            const rankedNotes = await fetchAPI(`/assistant/search?query=${encodeURIComponent(query)}`);

            let html = `<div style="display: flex; flex-direction: column; gap: 0.5rem;">`;
            rankedNotes.forEach((note, idx) => {
                const isTopRank = idx === 0 && note.score > 0;
                const scoreColor = note.score > 0 ? "#4ade80" : "var(--text-muted)";
                const rankTextColor = (isTopRank || note.score > 0) ? "#4ade80" : "inherit";
                const rowStyle = isTopRank
                    ? "flex-direction: column; align-items: flex-start; gap: 0.25rem; background: rgba(34, 197, 94, 0.1); border-left: 3px solid #4ade80;"
                    : "flex-direction: column; align-items: flex-start; gap: 0.25rem;";

                html += `
                    <div class="sorted-row" style="${rowStyle}">
                        <div style="display: flex; justify-content: space-between; width: 100%;">
                            <strong style="color: ${rankTextColor};">Rank #${idx + 1} (Note ID #${note.id})</strong>
                            <span style="color: ${scoreColor}; font-weight: 600;">Score: ${note.score}</span>
                        </div>
                        <p style="margin: 0; font-size: 0.88rem; color: var(--text-color);">${note.text}</p>
                    </div>
                `;
            });
            html += `</div>`;
            aiSearchResults.innerHTML = html;
        } catch (e) {
            aiSearchResults.innerHTML = `<p class="error-text">❌ ${e.message || "Failed to perform semantic note search."}</p>`;
        }
    };

    aiSearchBtn.addEventListener("click", handleSearch);
    aiSearchQueryInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleSearch();
    });
}

// Close Error Banner Handler
if (closeErrorBtn) {
    closeErrorBtn.addEventListener("click", hideError);
}

// Initial Load on Page Startup
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        loadRoster();
    });
} else {
    loadRoster();
}
