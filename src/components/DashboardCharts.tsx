"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  ScoreTrendPoint,
  PartAccuracy,
  DifficultyAccuracy,
  TimeOfDayBucket,
  SourceTagAccuracy,
} from "@/lib/analytics";

export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">No mock tests submitted yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(data.length / 12))} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="scorePercent" stroke="#18181b" strokeWidth={2} dot={false} name="Score %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function PartAccuracyChart({ data }: { data: PartAccuracy[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data.map((d) => ({ name: `Part ${d.part}`, accuracy: d.accuracyPercent }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DifficultyAccuracyChart({ data }: { data: DifficultyAccuracy[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data.map((d) => ({ name: d.difficulty, accuracy: d.accuracyPercent }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="accuracy" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const SOURCE_TAG_LABEL: Record<string, string> = {
  "question-bank-2017": "Question bank (2017)",
  "question-bank-2022": "Question bank (2022)",
  "question-bank-2024": "Question bank (2024)",
  "question-bank-2025": "Question bank (2025)",
  "web-research": "Web research",
  authored: "Authored (no direct past-paper hit)",
};

export function SourceTagAccuracyChart({ data }: { data: SourceTagAccuracy[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">No data yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart
        data={data.map((d) => ({ name: SOURCE_TAG_LABEL[d.sourceTag] ?? d.sourceTag, accuracy: d.accuracyPercent }))}
        layout="vertical"
        margin={{ left: 16 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={180} />
        <Tooltip />
        <Bar dataKey="accuracy" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimeOfDayChart({ data }: { data: TimeOfDayBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data.map((d) => ({ name: `${d.hour}:00`, count: d.count }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={1} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
