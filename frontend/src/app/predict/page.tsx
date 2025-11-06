"use client";

import { useState } from "react";

export default function PredictPage() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    // Split the user input into an array
    const symptomsArray = symptoms
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");

    try {
      const AI_URL =
        process.env.NEXT_PUBLIC_AI_MODEL_URL || "http://127.0.0.1:5000";
      const response = await fetch(`${AI_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ symptoms: symptomsArray }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to predict disease");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-700 mb-4">
        AI Disease Predictor
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="font-medium text-gray-700">
            Enter your symptoms (comma-separated)
          </span>
          <input
            type="text"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. sunken_eyes, breathlessness, sweating"
            className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-blue-700 mb-2">
            Prediction Result
          </h2>
          <p>
            <strong>Disease:</strong> {result.predicted_disease}
          </p>
          <p className="mt-2 text-gray-700">{result.description}</p>

          <div className="mt-4">
            <strong>First Aid:</strong>
            <ul className="list-disc ml-6">
              {result.precautions.map((p: string, i: number) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <strong>Medications:</strong>
            <ul className="list-disc ml-6">
              {result.medications.map((m: string, i: number) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <strong>Diet:</strong>
            <ul className="list-disc ml-6">
              {result.diet.map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <strong>Precautions:</strong>
            <ul className="list-disc ml-6">
              {result.workout.map((w: string, i: number) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
