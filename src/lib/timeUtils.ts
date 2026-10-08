import { TempoNivel } from '../types/order';

export interface FormattedWaitTime {
  display: string;
  totalSeconds: number;
  minutes: number;
  nivel: TempoNivel;
  isUrgent: boolean;
}

export const calculateWaitTime = (createdAtIso: string, currentTimeMs: number = Date.now()): FormattedWaitTime => {
  const createdMs = new Date(createdAtIso).getTime();
  const diffMs = currentTimeMs - createdMs;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  let display = '';
  if (hours > 0) {
    display = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  } else {
    display = `${pad(minutes)}:${pad(seconds)}`;
  }

  // Thresholds for burger kitchen
  // Normal: < 10 minutes
  // Atenção: 10 - 18 minutes
  // Crítico: > 18 minutes
  let nivel: TempoNivel = 'normal';
  if (totalSeconds >= 18 * 60) {
    nivel = 'critico';
  } else if (totalSeconds >= 10 * 60) {
    nivel = 'atencao';
  }

  return {
    display,
    totalSeconds,
    minutes: Math.floor(totalSeconds / 60),
    nivel,
    isUrgent: nivel === 'critico',
  };
};

export const formatOrderTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};
