"use client";

import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { auth, db } from "../../lib/firebase";

type Currency = "USD" | "USC";

type Projection = {
  month: number;
  projectedCapital: number;
  estimatedProfit: number;
};

type PdfReportProps = {
  capital: number;
  currency: Currency;
  percentage: number;
  lot: number;
  estimatedProfit: number;
  finalCapital: number;
  projections: Projection[];
};

type PdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

export default function PdfReport({
  capital,
  currency,
  percentage,
  lot,
  estimatedProfit,
  finalCapital,
  projections,
}: PdfReportProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function formatMoney(value: number) {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  async function loadImageAsDataUrl(path: string): Promise<string> {
    const response = await fetch(path);

    if (!response.ok) {
      throw new Error("No se pudo cargar el logo.");
    }

    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo procesar el logo."));

      reader.readAsDataURL(blob);
    });
  }

  async function generatePdf() {
    setMessage("");
    setError("");

    const user = auth.currentUser;

    if (!user) {
      setError("Debes iniciar sesión para generar el reporte.");
      return;
    }

    setLoading(true);

    try {
      const profileSnapshot = await getDoc(
        doc(db, "users", user.uid)
      );

      const profile = profileSnapshot.data();

      const clientName = String(
        profile?.name ?? "Cliente AILANUX"
      );

      const clientEmail = String(
        profile?.email ?? user.email ?? ""
      );

      const reportDate = new Intl.DateTimeFormat("es-CO", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date());

      const reportCode = `AIL-${Date.now()
        .toString()
        .slice(-10)}`;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      }) as PdfWithAutoTable;

      const pageWidth = pdf.internal.pageSize.getWidth();

      /*
       * Encabezado
       */
      pdf.setFillColor(5, 7, 10);
      pdf.rect(0, 0, pageWidth, 42, "F");

      try {
        const logo = await loadImageAsDataUrl(
          "/images/logo-ailanux.png"
        );

        pdf.addImage(logo, "PNG", 14, 8, 25, 25);
      } catch {
        // El PDF continúa aunque el logo no pueda cargarse.
      }

      pdf.setTextColor(245, 190, 60);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("AILANUX CENTER", 45, 18);

      pdf.setTextColor(210, 220, 235);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Reporte privado de simulación financiera", 45, 25);

      pdf.setTextColor(150, 160, 175);
      pdf.setFontSize(8);
      pdf.text(`Código: ${reportCode}`, 45, 31);

      /*
       * Información del cliente
       */
      pdf.setTextColor(25, 30, 40);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("Información del cliente", 14, 52);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      pdf.text(`Nombre: ${clientName}`, 14, 61);
      pdf.text(`Correo: ${clientEmail}`, 14, 68);
      pdf.text(`Fecha del reporte: ${reportDate}`, 14, 75);

      /*
       * Resumen de la simulación
       */
      autoTable(pdf, {
        startY: 84,
        head: [
          [
            "Capital inicial",
            "Perfil",
            "Lotaje",
            "Ganancia a 12 meses",
            "Capital a 12 meses",
          ],
        ],
        body: [
          [
            `${formatMoney(capital)} ${currency}`,
            `${percentage}%`,
            lot.toFixed(2),
            `${formatMoney(estimatedProfit)} ${currency}`,
            `${formatMoney(finalCapital)} ${currency}`,
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [17, 38, 65],
          textColor: [245, 190, 60],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          textColor: [30, 35, 45],
          fontSize: 8,
        },
        styles: {
          cellPadding: 3,
          halign: "center",
        },
      });

      const firstTableEnd =
        pdf.lastAutoTable?.finalY ?? 110;

      /*
       * Tabla de proyecciones
       */
      pdf.setTextColor(25, 30, 40);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Proyección mensual estimada",
        14,
        firstTableEnd + 13
      );

      autoTable(pdf, {
        startY: firstTableEnd + 18,
        head: [
          [
            "Periodo",
            "Capital inicial",
            "Ganancia estimada",
            "Capital proyectado",
          ],
        ],
        body: projections.map((projection) => [
          `${projection.month} ${
            projection.month === 1 ? "mes" : "meses"
          }`,
          `${formatMoney(capital)} ${currency}`,
          `${formatMoney(
            projection.estimatedProfit
          )} ${currency}`,
          `${formatMoney(
            projection.projectedCapital
          )} ${currency}`,
        ]),
        theme: "striped",
        headStyles: {
          fillColor: [17, 38, 65],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 244, 248],
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: "center",
        },
      });

      const secondTableEnd =
        pdf.lastAutoTable?.finalY ?? 185;

      /*
       * Aviso legal
       */
      pdf.setFillColor(250, 247, 235);
      pdf.roundedRect(
        14,
        secondTableEnd + 10,
        pageWidth - 28,
        27,
        3,
        3,
        "F"
      );

      pdf.setTextColor(95, 80, 45);
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");

      const disclaimer =
        "Este documento presenta una simulación matemática basada en los datos seleccionados. No representa una promesa, garantía de rentabilidad ni asesoría financiera. Los resultados reales pueden variar.";

      const disclaimerLines = pdf.splitTextToSize(
        disclaimer,
        pageWidth - 38
      );

      pdf.text(
        disclaimerLines,
        19,
        secondTableEnd + 18
      );

      /*
       * Pie del documento
       */
      pdf.setTextColor(130, 140, 155);
      pdf.setFontSize(8);
      pdf.text(
        "AILANUX CENTER · Simulación y gestión privada",
        pageWidth / 2,
        289,
        { align: "center" }
      );

      const safeClientName = clientName
        .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      pdf.save(
        `AILANUX-${safeClientName || "Cliente"}-${reportCode}.pdf`
      );

      setMessage("Reporte PDF generado correctamente.");
    } catch (pdfError) {
      console.error(pdfError);
      setError("No se pudo generar el reporte PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={generatePdf}
        disabled={loading}
        className="w-full rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 font-bold text-amber-300 transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Generando reporte..."
          : "Descargar reporte PDF"}
      </button>

      {message && (
        <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {error && (
        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}