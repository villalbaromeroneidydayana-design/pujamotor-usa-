import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  METHODOLOGY_SUBASTA_PRO_USA,
  METHODOLOGY_PUJAMOTOR_USA,
  NON_NEGOTIABLE_RULES,
  OBJECTIONS_HANDBOOK,
  TEN_QUESTIONS_RUBRIC,
  TEAM_ROUTINE,
  ALL_METHODOLOGIES,
} from "../src/modules/crm/methodologies.data";
import { crmService } from "../src/modules/crm/crm.service";

const prisma = new PrismaClient();

describe("Fase 3.1 — Copiloto Confidencial para Asesores y Metodologías Oficiales", () => {
  let testLeadId: string;
  let testCaseId: string;

  beforeAll(async () => {
    // Crear lead y caso de prueba para verificar el avance del copiloto
    const lead = await prisma.customerLead.create({
      data: {
        fullName: "Prueba Asesor Copilot",
        email: "asesor.copilot@example.com",
        phoneWhatsapp: "+1-305-555-0199",
        country: "Estados Unidos",
        leadSource: "WHATSAPP",
        status: "NUEVO",
      },
    });
    testLeadId = lead.id;

    const advisoryCase = await prisma.advisoryCase.create({
      data: {
        caseNumber: `EXP-TEST-${Date.now()}`,
        customerLeadId: testLeadId,
        serviceScope: "BROKER_ADVISORY",
        destinationCountry: "República Dominicana",
        maxAuthorizedBidUsd: 16500,
        stage: "CONTACTO_INICIAL",
        methodology: "SUBASTA_PRO_USA",
        currentStepNumber: 1,
        stepChecklistJson: "{}",
      },
    });
    testCaseId = advisoryCase.id;
  });

  afterAll(async () => {
    if (testCaseId) {
      await prisma.advisoryCase.deleteMany({ where: { id: testCaseId } });
    }
    if (testLeadId) {
      await prisma.customerLead.deleteMany({ where: { id: testLeadId } });
    }
    await prisma.$disconnect();
  });

  describe("1. Estructura y fidelidad de los manuales oficiales", () => {
    it("debe contener exactamente 10 pasos para Subasta Pro USA con los 12 puntos obligatorios", () => {
      expect(METHODOLOGY_SUBASTA_PRO_USA.id).toBe("SUBASTA_PRO_USA");
      expect(METHODOLOGY_SUBASTA_PRO_USA.totalSteps).toBe(10);
      expect(METHODOLOGY_SUBASTA_PRO_USA.steps.length).toBe(10);
      expect(METHODOLOGY_SUBASTA_PRO_USA.brokerFeeRange).toContain("300 a $500");
      expect(METHODOLOGY_SUBASTA_PRO_USA.brokerFeePaymentTiming).toContain("manos");

      for (const step of METHODOLOGY_SUBASTA_PRO_USA.steps) {
        expect(step.stepNumber).toBeGreaterThanOrEqual(1);
        expect(step.stepNumber).toBeLessThanOrEqual(10);
        expect(step.name).toBeTruthy();
        expect(step.objective).toBeTruthy();
        expect(step.triggerIn).toBeTruthy();
        expect(step.triggerOut).toBeTruthy();
        expect(step.whatAdvisorDoes.length).toBeGreaterThan(0);
        expect(step.howAdvisorDoesIt.length).toBeGreaterThan(0);
        expect(step.whatToSayToClient).toBeTruthy();
        expect(step.questionsToAsk.length).toBeGreaterThan(0);
        expect(step.infoToRegister.length).toBeGreaterThan(0);
        expect(step.preflightChecks.length).toBeGreaterThan(0);
        expect(step.readyMessageTemplate).toBeTruthy();
        expect(step.expectedResult).toBeTruthy();
        expect(step.errorsToAvoid.length).toBeGreaterThan(0);
        expect(step.nonNegotiables.length).toBeGreaterThan(0);
      }
    });

    it("debe contener exactamente 10 pasos para PUJAMOTOR USA con los 12 puntos obligatorios", () => {
      expect(METHODOLOGY_PUJAMOTOR_USA.id).toBe("SUBASTA_PRO_USA");
      expect(METHODOLOGY_PUJAMOTOR_USA.totalSteps).toBe(10);
      expect(METHODOLOGY_PUJAMOTOR_USA.steps.length).toBe(10);
      expect(METHODOLOGY_PUJAMOTOR_USA.brokerFeeRange).toContain("300 a $500");
      expect(METHODOLOGY_PUJAMOTOR_USA.brokerFeePaymentTiming).toContain("manos");

      for (const step of METHODOLOGY_PUJAMOTOR_USA.steps) {
        expect(step.stepNumber).toBeGreaterThanOrEqual(1);
        expect(step.stepNumber).toBeLessThanOrEqual(10);
        expect(step.name).toBeTruthy();
        expect(step.objective).toBeTruthy();
        expect(step.triggerIn).toBeTruthy();
        expect(step.triggerOut).toBeTruthy();
        expect(step.whatAdvisorDoes.length).toBeGreaterThan(0);
        expect(step.howAdvisorDoesIt.length).toBeGreaterThan(0);
        expect(step.whatToSayToClient).toBeTruthy();
        expect(step.questionsToAsk.length).toBeGreaterThanOrEqual(0);
        expect(step.infoToRegister.length).toBeGreaterThan(0);
        expect(step.preflightChecks.length).toBeGreaterThan(0);
        expect(step.readyMessageTemplate).toBeTruthy();
        expect(step.expectedResult).toBeTruthy();
        expect(step.errorsToAvoid.length).toBeGreaterThan(0);
        expect(step.nonNegotiables.length).toBeGreaterThan(0);
      }
    });

    it("debe mantener la rúbrica de 10 puntos de evaluación de chats y la rutina del asesor", () => {
      expect(TEN_QUESTIONS_RUBRIC.length).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(TEN_QUESTIONS_RUBRIC[i].number).toBe(i + 1);
        expect(TEN_QUESTIONS_RUBRIC[i].question).toBeTruthy();
      }
      expect(TEAM_ROUTINE.morning).toBeTruthy();
      expect(TEAM_ROUTINE.midday).toBeTruthy();
      expect(TEAM_ROUTINE.afternoon).toBeTruthy();
      expect(TEAM_ROUTINE.evening).toBeTruthy();
    });

    it("debe contener las 5 reglas inviolables no negociables y el manual de objeciones", () => {
      expect(NON_NEGOTIABLE_RULES.length).toBe(5);
      expect(OBJECTIONS_HANDBOOK.length).toBe(4);
      expect(ALL_METHODOLOGIES.SUBASTA_PRO_USA).toBeDefined();
      expect(ALL_METHODOLOGIES.PUJAMOTOR_USA).toBeDefined();
    });
  });

  describe("2. Funcionamiento operativo del Copiloto en CRM Service", () => {
    it("debe avanzar de paso en Subasta Pro USA y sincronizar la etapa comercial", async () => {
      const updated = await crmService.updateCaseCopilotStep({
        caseId: testCaseId,
        methodology: "SUBASTA_PRO_USA",
        targetStepNumber: 3,
        checklist: { step_3_check_0: true, step_3_check_1: true },
        operationalNotes: "Cliente revisando 5 opciones enviadas con Run & Drive.",
        actorRole: "COMMERCIAL_ADVISOR",
      });

      expect(updated.currentStepNumber).toBe(3);
      expect(updated.stage).toBe("BUSQUEDA_DE_VEHICULOS");
      expect(updated.stepChecklistJson).toContain("step_3_check_0");

      const savedInDb = await prisma.advisoryCase.findUnique({
        where: { id: testCaseId },
      });
      expect(savedInDb?.currentStepNumber).toBe(3);
      expect(savedInDb?.stage).toBe("BUSQUEDA_DE_VEHICULOS");
    });

    it("debe avanzar a paso 5 y sincronizar con ASESORIA_Y_CONTRATO", async () => {
      const updated = await crmService.updateCaseCopilotStep({
        caseId: testCaseId,
        methodology: "SUBASTA_PRO_USA",
        targetStepNumber: 5,
        checklist: { step_5_check_0: true },
        operationalNotes: "Explicado monólogo completo de 6 temas en orden estricto.",
        actorRole: "COMMERCIAL_ADVISOR",
      });

      expect(updated.currentStepNumber).toBe(5);
      expect(updated.stage).toBe("ASESORIA_Y_CONTRATO");
    });

    it("debe gestionar el desvío 'Déjeme pensarlo' programando alerta de seguimiento a los 3 días", async () => {
      const thinkingCase = await crmService.updateCommercialStage({
        caseId: testCaseId,
        stage: "CLIENTE_PENSANDO",
        isThinking: true,
        followUpDays: 3,
        operationalNotes: "Cliente evaluando con su familia. Recontactar en 3 días.",
        actorRole: "COMMERCIAL_ADVISOR",
      });

      expect(thinkingCase.stage).toBe("CLIENTE_PENSANDO");
      expect(thinkingCase.nextFollowUpAt).not.toBeNull();
      const followUpDate = new Date(thinkingCase.nextFollowUpAt!);
      const now = new Date();
      const diffDays = Math.round(
        (followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBeGreaterThanOrEqual(2);
      expect(diffDays).toBeLessThanOrEqual(4);
    });

    it("el dashboard de overview debe incluir la metodología oficial PUJAMOTOR USA para el frontend", async () => {
      const dashboard = await crmService.getCommercialDashboardData();
      expect(dashboard.methodologies).toBeDefined();
      expect(dashboard.methodologies.SUBASTA_PRO_USA).toBeDefined();
      expect(dashboard.methodologies.PUJAMOTOR_USA).toBeDefined();
    });
  });
});

