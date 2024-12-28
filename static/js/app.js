document.addEventListener("DOMContentLoaded", () => {
    // Function to display toast notifications
    function showToast(message, isError = false, duration = 3000) {
        const toastBody = document.getElementById("toast-body");

        if (!toastBody) {
            console.error("Error: toast-body not found in the DOM!");
            return;
        }

        toastBody.innerText = message;

        const toastElement = document.getElementById("liveToast");
        if (!toastElement) {
            console.error("Error: liveToast not found in the DOM!");
            return;
        }

        toastElement.classList.remove("bg-success", "bg-danger");
        toastElement.classList.add(isError ? "bg-danger" : "bg-success");

        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();
    }

    // Function to fetch the current workout plan
    async function fetchWorkoutPlan() {
        const currentPath = window.location.pathname;
        if (currentPath !== "/workout_plan") {
            console.log(`DEBUG: Skipping fetchWorkoutPlan for path: ${currentPath}`);
            return;
        }

        try {
            const response = await fetch("/get_workout_plan");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch workout plan.");
            }

            console.log("DEBUG: Workout plan data fetched:", data);
            reloadWorkoutPlan(data);
        } catch (error) {
            console.error("Error loading workout plan:", error);
            showToast("Unable to load workout plan. Please try again later.", true);
        }
    }

    // Function to reload the workout plan table with data
    function reloadWorkoutPlan(data) {
        const workoutTable = document.getElementById("workout_plan_table_body");

        if (!workoutTable) {
            console.error("Error: workout_plan_table_body not found in the DOM!");
            showToast("Error loading workout plan. Please refresh the page.", true);
            return;
        }

        // Only clear the table if we're not adding a new exercise
        if (!data || !data.length) {
            workoutTable.innerHTML = `
                <tr>
                    <td colspan="17" class="text-center text-muted">No exercises in the workout plan.</td>
                </tr>`;
            return;
        }

        // If this is a new exercise being added (from add_exercise response)
        if (data[0] && !data[0].id) {
            // Fetch the full workout plan to get proper IDs
            fetchWorkoutPlan();
            return;
        }

        // Clear existing rows
        workoutTable.innerHTML = "";

        // Add all exercises to the table
        data.forEach((item) => {
            if (!item.id) {
                console.error("Missing ID for exercise:", item);
                return;
            }

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.routine || "N/A"}</td>
                <td>${item.exercise || "N/A"}</td>
                <td>${item.primary_muscle_group || "N/A"}</td>
                <td>${item.secondary_muscle_group || "N/A"}</td>
                <td>${item.tertiary_muscle_group || "N/A"}</td>
                <td>${item.advanced_isolated_muscles || "N/A"}</td>
                <td>${item.utility || "N/A"}</td>
                <td>${item.sets || "N/A"}</td>
                <td>${item.min_rep_range || "N/A"}</td>
                <td>${item.max_rep_range || "N/A"}</td>
                <td>${item.rir || "N/A"}</td>
                <td>${item.rpe !== null ? item.rpe : "N/A"}</td>
                <td>${item.weight || "N/A"}</td>
                <td>${item.grips || "N/A"}</td>
                <td>${item.stabilizers || "N/A"}</td>
                <td>${item.synergists || "N/A"}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeExercise(${item.id})">Remove</button>
                </td>`;
            workoutTable.appendChild(row);
        });
    }

    // Function to add a new exercise to the workout plan
    function addExercise() {
        console.log('addExercise function called');

        const exercise = document.getElementById('exercise')?.value;
        const routine = document.getElementById('routine')?.value;
        const sets = document.getElementById('sets')?.value;
        const minRepRange = document.getElementById('min_rep')?.value;
        const maxRepRange = document.getElementById('max_rep_range')?.value;
        const rir = document.getElementById('rir')?.value;
        const weight = document.getElementById('weight')?.value;
        const rpe = document.getElementById('rpe')?.value;

        console.log('Form values:', { 
            exercise, routine, sets, minRepRange, 
            maxRepRange, rir, weight, rpe 
        });

        // Validate required fields
        if (!exercise || !routine || !sets || !minRepRange || !maxRepRange || !weight) {
            showToast('Please fill in all required fields', true);
            return;
        }

        // Create the exercise data object
        const exerciseData = {
            exercise: exercise,
            routine: routine,
            sets: parseInt(sets),
            min_rep_range: parseInt(minRepRange),
            max_rep_range: parseInt(maxRepRange),
            rir: parseInt(rir || 0),
            weight: parseFloat(weight),
            rpe: rpe ? parseFloat(rpe) : null
        };

        console.log('Sending exercise data:', exerciseData);

        // Send POST request to add exercise
        fetch('/add_exercise', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(exerciseData)
        })
        .then(response => {
            console.log('Response received:', response); // Debug log
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data); // Debug log
            if (data.error) {
                throw new Error(data.error);
            }
            showToast('Exercise added successfully');
            fetchWorkoutPlan(); // Refresh the workout plan table
            resetFormFields();
        })
        .catch(error => {
            console.error('Error:', error);
            showToast(error.message || 'Failed to add exercise', true);
        });
    }

    // Function to reset form fields after adding exercise
    function resetFormFields() {
        document.getElementById('sets').value = '1';
        document.getElementById('rir').value = '0';
        document.getElementById('weight').value = '100';
        document.getElementById('min_rep').value = '3';
        document.getElementById('max_rep_range').value = '5';
        if (document.getElementById('rpe')) {
            document.getElementById('rpe').value = ''; // Reset RPE field if it exists
        }
    }

    // Function to remove an exercise from the workout plan
    async function removeExercise(exerciseId) {
        if (!exerciseId) {
            console.error("Error: exercise ID is required to remove an exercise.");
            showToast("Exercise ID is missing. Unable to remove exercise.", true);
            return;
        }

        try {
            const response = await fetch("/remove_exercise", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: exerciseId }),
            });

            const result = await response.json();

            if (response.ok) {
                console.log("DEBUG: Exercise removed successfully:", result);
                showToast(result.message || "Exercise removed successfully!");
                // Use fetchWorkoutPlan instead of reloadWorkoutPlan
                fetchWorkoutPlan();
            } else {
                console.error("Error removing exercise:", result.message);
                showToast(result.message || "Failed to remove exercise.", true);
            }
        } catch (error) {
            console.error("Error removing exercise:", error);
            showToast(`Unable to remove exercise: ${error.message}`, true);
        }
    }

    // Function to filter exercises
    async function filterExercises() {
        try {
            const filters = {};
            const filterElements = document.querySelectorAll('#filters-form select');
            const exerciseDropdown = document.getElementById("exercise");
            
            filterElements.forEach(select => {
                if (select.value) {
                    filters[select.id] = select.value;
                }
            });

            console.log("DEBUG: Collected filters:", filters);

            if (Object.keys(filters).length === 0) {
                showToast("Please select at least one filter", true);
                return;
            }

            const response = await fetch("/filter_exercises", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(filters)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to filter exercises");
            }

            exerciseDropdown.innerHTML = '<option value="">Select Exercise</option>';
            
            data.forEach(exercise => {
                const option = document.createElement("option");
                option.value = exercise;
                option.textContent = exercise;
                exerciseDropdown.appendChild(option);
            });

            // Add glow effect
            exerciseDropdown.classList.add('filter-applied');
            
            // Remove glow effect after 2 seconds
            setTimeout(() => {
                exerciseDropdown.classList.remove('filter-applied');
            }, 2000);

            showToast(`Found ${data.length} matching exercises`);
        } catch (error) {
            console.error("Error filtering exercises:", error);
            showToast("Failed to filter exercises", true);
        }
    }

    // Function to reset all filters
    function clearFilters() {
        const filterElements = document.querySelectorAll('#filters-form select');
        const exerciseDropdown = document.getElementById("exercise");
        
        // Reset all filter dropdowns
        filterElements.forEach(select => {
            if (select.classList.contains('filter-dropdown')) {
                select.value = '';
                select.style.backgroundColor = '#e3f2fd';  // Reset to default light blue
            }
        });

        // Reset exercise dropdown
        fetch("/get_all_exercises")
            .then(response => response.json())
            .then(data => {
                exerciseDropdown.innerHTML = '<option value="">Select Exercise</option>';
                data.forEach(exercise => {
                    const option = document.createElement("option");
                    option.value = exercise;
                    option.textContent = exercise;
                    exerciseDropdown.appendChild(option);
                });
                
                // Remove any applied filter effects
                exerciseDropdown.classList.remove('filter-applied');
                showToast("All filters cleared");
            })
            .catch(error => {
                console.error("Error resetting exercises:", error);
                showToast("Failed to reset exercises", true);
            });
    }

    // Attach functions to the global scope
    window.addExercise = addExercise;
    window.removeExercise = removeExercise;
    window.filterExercises = filterExercises;

    // Initialize event listeners
    document.getElementById("filter-btn")?.addEventListener("click", filterExercises);

    fetchWorkoutPlan();

    document.getElementById('export-to-log-btn')?.addEventListener('click', async function() {
        try {
            const response = await fetch('/export_to_workout_log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                showToast(result.message);
                // Optionally redirect to workout log
                window.location.href = '/workout_log';
            } else {
                throw new Error(result.error || 'Failed to export workout plan');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to export workout plan', true);
        }
    });

    function updateExerciseDetails(exercise) {
        return {
            primaryMuscle: exercise.primary_muscle_group,
            secondaryMuscle: exercise.secondary_muscle_group,
            tertiaryMuscle: exercise.tertiary_muscle_group,
            isolatedMuscles: exercise.advanced_isolated_muscles,
            utility: exercise.utility,
            // ...
        };
    }

    // AI Assistant Functions
    function openAIAssistant() {
        const modal = new bootstrap.Modal(document.getElementById('aiAssistantModal'));
        modal.show();
    }

    function sendMessage() {
        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML += `
            <div class="user-message">
                ${message}
            </div>
        `;
        
        // Clear input
        userInput.value = '';
        
        // Simulate AI response (replace with actual API call later)
        setTimeout(() => {
            chatMessages.innerHTML += `
                <div class="ai-message">
                    I'm currently in development. Soon I'll be able to help you optimize your training plan!
                </div>
            `;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 1000);
    }

    // Initialize when document is loaded
    document.addEventListener('DOMContentLoaded', () => {
        initializeRoutineOptions();
        // ... existing code ...
    });

    // Function to update workout plan table
    function updateWorkoutPlanTable(exercises) {
        const tableBody = document.getElementById('workout_plan_table_body');
        if (!tableBody) return;

        // Clear existing content
        tableBody.innerHTML = '';

        exercises.forEach(exercise => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${exercise.id}</td>
                <td>${exercise.routine}</td>
                <td>${exercise.exercise}</td>
                <td>${exercise.primary_muscle_group || ''}</td>
                <td>${exercise.secondary_muscle_group || ''}</td>
                <td>${exercise.tertiary_muscle_group || ''}</td>
                <td>${exercise.advanced_isolated_muscles || ''}</td>
                <td>${exercise.utility || ''}</td>
                <td>${exercise.sets}</td>
                <td>${exercise.min_rep_range}</td>
                <td>${exercise.max_rep_range}</td>
                <td>${exercise.rir}</td>
                <td>${exercise.weight}</td>
                <td>${exercise.grips || ''}</td>
                <td>${exercise.stabilizers || ''}</td>
                <td>${exercise.synergists || ''}</td>
                <td>
                    <button class="btn btn-danger btn-sm" onclick="removeExercise(${exercise.id})">
                        Remove
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Add interaction effects for filter dropdowns
    document.querySelectorAll('.filter-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', function() {
            if (this.value) {
                this.style.backgroundColor = '#fff';
                // Trigger filter update when any filter changes
                filterExercises();
            } else {
                this.style.backgroundColor = '#e3f2fd';
            }
        });
    });

    // Handle routine dropdown click state
    const routineDropdown = document.querySelector('.routine-dropdown');
    if (routineDropdown) {
        routineDropdown.addEventListener('click', function() {
            this.classList.add('clicked');
        });

        // Reset background when clicking outside
        document.addEventListener('click', function(event) {
            if (!routineDropdown.contains(event.target)) {
                routineDropdown.classList.remove('clicked');
            }
        });
    }

    // Add clear filters button event listener
    document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);

    // Bind addExercise function to the Add Exercise button
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    if (addExerciseBtn) {
        addExerciseBtn.addEventListener('click', addExercise);
        console.log('Add Exercise button listener attached');
    } else {
        console.error('Add Exercise button not found in the DOM');
    }

    // Handle editable fields
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('click', function(e) {
            // Don't trigger if clicking on the input
            if (e.target.classList.contains('editable-input')) {
                return;
            }
            
            const input = this.querySelector('.editable-input');
            const text = this.querySelector('.editable-text');
            
            if (input) {
                text.style.display = 'none';
                input.style.display = 'block';
                input.focus();
            }
        });
    });

    // Handle clicking outside editable fields
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.editable') && !e.target.classList.contains('editable-input')) {
            document.querySelectorAll('.editable-input').forEach(input => {
                input.style.display = 'none';
            });
            document.querySelectorAll('.editable-text').forEach(text => {
                text.style.display = 'block';
            });
        }
    });
});

// Function to update progression date
async function updateProgressionDate(logId, newDate) {
    try {
        const response = await fetch('/update_progression_date', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: logId,
                date: newDate
            })
        });

        if (response.ok) {
            // Find the correct cell and update its text content
            const input = document.querySelector(`input[onchange="updateProgressionDate('${logId}', this.value)"]`);
            if (input) {
                const textSpan = input.nextElementSibling;
                textSpan.textContent = newDate || 'Click to set date';
                showToast('Progression date updated successfully');
            } else {
                console.error('Could not find input element for log ID:', logId);
            }
        } else {
            throw new Error('Failed to update progression date');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update progression date', true);
    }
}

// Function to update scored values
async function updateScoredValue(logId, field, value) {
    try {
        const response = await fetch('/update_workout_log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: logId,
                updates: {
                    [field]: value === '' ? null : Number(value)
                }
            })
        });

        if (response.ok) {
            const input = document.querySelector(`input[onchange="updateScoredValue('${logId}', '${field}', this.value)"]`);
            if (input) {
                const textSpan = input.nextElementSibling;
                textSpan.textContent = value || 'Click to set';
                
                // Check progressive overload after updating the text
                setTimeout(() => checkProgressiveOverload(logId), 0);
                
                showToast('Value updated successfully');
            } else {
                console.error('Could not find input element for log ID:', logId);
            }
        } else {
            throw new Error('Failed to update value');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update value', true);
    }
}

// Function to check progressive overload
function checkProgressiveOverload(logId) {
    const row = document.querySelector(`tr[data-log-id="${logId}"]`);
    if (!row) {
        console.error('Row not found for log ID:', logId);
        return;
    }

    // Get planned values
    const planned_rir = parseFloat(row.querySelector('[data-field="planned_rir"]')?.textContent) || 0;
    const planned_rpe = parseFloat(row.querySelector('[data-field="planned_rpe"]')?.textContent) || 0;
    const planned_min_reps = parseFloat(row.querySelector('[data-field="planned_min_reps"]')?.textContent) || 0;
    const planned_max_reps = parseFloat(row.querySelector('[data-field="planned_max_reps"]')?.textContent) || 0;
    const planned_weight = parseFloat(row.querySelector('[data-field="planned_weight"]')?.textContent) || 0;

    // Get scored values (from the span elements inside the editable cells)
    const scored_rir = parseFloat(row.querySelector('[data-field="scored_rir"] .editable-text')?.textContent) || 0;
    const scored_rpe = parseFloat(row.querySelector('[data-field="scored_rpe"] .editable-text')?.textContent) || 0;
    const scored_min_reps = parseFloat(row.querySelector('[data-field="scored_min_reps"] .editable-text')?.textContent) || 0;
    const scored_max_reps = parseFloat(row.querySelector('[data-field="scored_max_reps"] .editable-text')?.textContent) || 0;
    const scored_weight = parseFloat(row.querySelector('[data-field="scored_weight"] .editable-text')?.textContent) || 0;

    console.log('Checking progressive overload:', {
        planned: { planned_rir, planned_rpe, planned_min_reps, planned_max_reps, planned_weight },
        scored: { scored_rir, scored_rpe, scored_min_reps, scored_max_reps, scored_weight }
    });

    const isProgressive = (
        (scored_rir && planned_rir && scored_rir < planned_rir) ||
        (scored_rpe && planned_rpe && scored_rpe > planned_rpe) ||
        (scored_min_reps && planned_min_reps && scored_min_reps > planned_min_reps) ||
        (scored_max_reps && planned_max_reps && scored_max_reps > planned_max_reps) ||
        (scored_weight && planned_weight && scored_weight > planned_weight)
    );

    const badge = row.querySelector('.badge');
    if (badge) {
        badge.className = `badge ${isProgressive ? 'bg-success' : 'bg-warning'}`;
        badge.textContent = isProgressive ? 'Achieved' : 'Pending';
        console.log('Updated badge:', isProgressive ? 'Achieved' : 'Pending');
    } else {
        console.error('Badge element not found');
    }
}
