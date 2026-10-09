import { format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const inicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export const hojeISO = () => format(new Date(), "yyyy-MM-dd");
export const paraISO = (d: Date) => format(d, "yyyy-MM-dd");
export const dataLonga = (iso: string) => inicial(format(parseISO(iso), "EEE, d 'de' MMM", { locale: ptBR }));
export const dataCurta = (iso: string) => format(parseISO(iso), "dd/MM", { locale: ptBR });
export const diaSemana = (iso: string) => format(parseISO(iso), "EEE", { locale: ptBR });
export const nomeMes = (d: Date) => inicial(format(d, "MMMM 'de' yyyy", { locale: ptBR }));
export const diasAte = (iso: string) => differenceInCalendarDays(parseISO(iso), new Date());

export function nestaSemana(iso: string) {
  const hoje = new Date();
  return isWithinInterval(parseISO(iso), {
    start: startOfWeek(hoje, { weekStartsOn: 1 }),
    end: endOfWeek(hoje, { weekStartsOn: 1 }),
  });
}

export function rotuloSemana(iso: string) {
  const d = parseISO(iso);
  const ini = startOfWeek(d, { weekStartsOn: 1 });
  const fim = endOfWeek(d, { weekStartsOn: 1 });
  return `${format(ini, "d MMM", { locale: ptBR })} – ${format(fim, "d MMM", { locale: ptBR })}`;
}

export const reais = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
