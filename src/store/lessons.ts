export interface Lesson {
  id: string;
  type: string;
  title: string;
  summary: string;
  options: QuestionOption[];
  difficulty: number;
  level: string;
  genres: string[];
  skills: string[];
};

export interface LickLearn extends Lesson {
  recordingUrl: string;
  transcription: string;
}

export interface IntervalTraining extends Lesson {
  recordingUrl: string;
}

export interface ImprovTraining extends Lesson {
  recordingUrl: string;
}

export interface RhythmTraining extends Lesson {
  recordingUrl: string;
}

export type QuestionOption = {
  text: string;
  isCorrect: boolean;
}

export type DailyLessonsPayload = {
  date: string; // YYYY-MM-DD
  lessons: Lesson[];
};

const lessonCache = new Map<string, Lesson[]>();

export const LessonCache = {
  set(date: string, lessons: Lesson[]) {
    lessonCache.set(date, lessons);
  },
  get(date: string) {
    return lessonCache.get(date) ?? [];
  },
  getAll() {
    return Array.from(lessonCache.entries()).map(([date, lessons]) => ({ date, lessons }));
  },
  getToday(): { date: string; lessons: Lesson[] } {
    const date = new Date().toISOString().slice(0, 10);
    return { date, lessons: lessonCache.get(date) ?? [] };
  },
  clear() {
    lessonCache.clear();
  }
};
