document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear previous options (keep placeholder)
      activitySelect.querySelectorAll("option:not([value=''])").forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list HTML (friendly message se vazio)
        const participantsHtml = details.participants && details.participants.length
          ? `<ul class="participants-list">${details.participants.map(p => `
              <li>
                <span class="participant-email">${p}</span>
                <button class="delete-participant" title="Remover" data-activity="${name}" data-email="${p}">
                  <span aria-hidden="true">🗑️</span>
                </button>
              </li>
            `).join("")}</ul>`
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <strong>Participants</strong>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Atualiza lista de atividades
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  // Delegated event listener para remover participante
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.closest && event.target.closest(".delete-participant")) {
      const btn = event.target.closest(".delete-participant");
      const activity = btn.getAttribute("data-activity");
      const email = btn.getAttribute("data-email");
      if (activity && email) {
        const confirmRemove = confirm(`Tem certeza que deseja remover o participante ${email} da atividade "${activity}"?`);
        if (!confirmRemove) return;
        try {
          const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
            method: "POST"
          });
          const result = await response.json();
          if (response.ok) {
            messageDiv.textContent = result.message || `Participante removido com sucesso.`;
            messageDiv.className = "success";
            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 4000);
            fetchActivities(); // Atualiza lista
          } else {
            alert(result.detail || "Erro ao remover participante.");
          }
        } catch (error) {
          alert("Falha ao remover participante.");
        }
      }
    }
  });
});
