  document.addEventListener("DOMContentLoaded", function () {
    const tahapSelect = document.getElementById("tanggalTahap");
    const subtahapDivs = document.querySelectorAll("[data-subtahap]");
    const form = document.getElementById("tanggalRencanaForm");
    const idKegiatan= document.getElementById("kegiatanId").value;

    function updateSubTahapVisibility() {
      const selected = tahapSelect.value;
      const visibleCount = selected === "specifyneeds" ? 6 : 
                           ["design", "build", "collect", "process", "analyse", "disseminate", "evaluate"].includes(selected) ? 4 : 0;

      subtahapDivs.forEach((div) => {
        const subtahapNum = parseInt(div.getAttribute("data-subtahap"));
        if (subtahapNum <= visibleCount) {
          div.classList.remove("hidden");
        } else {
          div.classList.add("hidden");
        }
      });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const idKegiatan = window.kegiatanId;
      const tahapSlug = tahapSelect.value;

      // Mapping tahap slug ke idTahap
      const tahapMap = {
        specifyneeds: 1,
        design: 2,
        build: 3,
        collect: 4,
        process: 5,
        analyse: 6,
        disseminate: 7,
        evaluate: 8
      };

      const idTahap = tahapMap[tahapSlug];
      const visibleCount = idTahap === 1 ? 6 : 4;

      const requests = [];

      for (let i = 1; i <= visibleCount; i++) {
        const input = document.getElementById(`subTahap${i}`);
        const tanggal = input.value;

        if (!tanggal) continue;

        const idSubTahap = i;
        const url = `/tahap/${idKegiatan}/${idTahap}/${idSubTahap}/rencana`;

        const req = fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ tanggalRencana: tanggal })
        });

        requests.push(req);
      }

      try {
        await Promise.all(requests);
        alert("Semua tanggal rencana berhasil dikirim!");
      } catch (err) {
        console.error(err);
        alert("Gagal mengirim beberapa rencana");
      }
    });

    tahapSelect.addEventListener("change", updateSubTahapVisibility);
    updateSubTahapVisibility(); // initial render
  });
