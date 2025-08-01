  document.addEventListener("DOMContentLoaded", function () {
    const tahapSelect = document.getElementById("tanggalTahap");
    const subtahapDivs = document.querySelectorAll("[data-subtahap]");
    const form = document.getElementById("tanggalRencanaForm");
    const idKegiatan= document.getElementById("kegiatanId").value;

    function updateSubTahapVisibility() {
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
      const visibleMap = {
        1: 6,
        2: 6,
        3: 7,
        4: 4,
        5: 8,
        6: 5,
        7: 5,
        8: 3
      };

      const visibleCount = visibleMap[idTahap] || 0; // fallback ke 0 jika idTahap tidak ada

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
      const visibleMap = {
        1: 6,
        2: 6,
        3: 7,
        4: 4,
        5: 8,
        6: 5,
        7: 5,
        8: 3
      };

      const visibleCount = visibleMap[idTahap] || 0; // fallback ke 0 jika idTahap tidak ada

      const requests = [];

      try {
        for (let i = 1; i <= visibleCount; i++) {
          const input = document.getElementById(`subTahap${i}`);
          const tanggal = input.value;

          if (!tanggal) continue;

          const idSubTahap = i;
          const url = `/surveys/tahap/${idKegiatan}/${idTahap}/${idSubTahap}/rencana`;

          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ tanggalRencana: tanggal })
          });
          
        }
        await fetch('/set-success-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Tanggal rencana berhasil disimpan' })
        });
        location.reload();
      } catch (err) {
        console.error(err);
        await fetch('/set-error-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: 'Tanggal rencana gagal disimpan' })
        });
        location.reload();
      }
    });

    tahapSelect.addEventListener("change", updateSubTahapVisibility);
    updateSubTahapVisibility(); // initial render
  });
