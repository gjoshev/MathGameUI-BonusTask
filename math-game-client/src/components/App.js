import React, { useEffect, useState } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";

const App = () => {
  const [connection, setConnection] = useState(null);
  const [results, setResults] = useState([]); 
  const [currentAnswer, setCurrentAnswer] = useState("");

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("http://localhost:5168/gamehub")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR");

          connection.on("NewQuestion", (newQuestion) => {
            setResults((prev) => [
              ...prev,
              {
                expression: newQuestion.expression,
                correctAnswer: newQuestion.correctAnswer,
                userAnswer: null,
                isCorrect: null,
              }
            ]);
            setCurrentAnswer("");
          });

          connection.on("ReceiveResult", (result) => {
            setResults((prevResults) =>
              prevResults.map((item, index) =>
                index === prevResults.length - 1
                  ? { ...item, isCorrect: result.isCorrect, userAnswer: result.userAnswer }
                  : item
              )
            );
          });
        })
        .catch((error) => console.error("Connection failed: ", error));
    }
  }, [connection]);

  const handleSubmitAnswer = (index) => {
    const currentResult = results[index];
    const userAnswer = parseFloat(currentAnswer.trim());
    const isCorrect = userAnswer === currentResult.correctAnswer;

    setResults((prevResults) =>
      prevResults.map((item, idx) =>
        idx === index
          ? { ...item, userAnswer: currentAnswer, isCorrect }
          : item
      )
    );
    
    connection
      .invoke("SubmitAnswer", "Player", currentResult.correctAnswer, userAnswer, isCorrect)
      .catch((err) => console.error("SubmitAnswer Error: ", err));

    setCurrentAnswer("");
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Math Game</h1>

      <div>
        <h2>Results:</h2>
        <table border="1" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Expression</th>
              <th>Your Answer</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>
                  {result.expression.split("=")[0].trim()} = ?
                </td>
                <td>
                  {result.userAnswer === null ? (
                    <div>
                      <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder="Type your answer"
                      />
                      <button onClick={() => handleSubmitAnswer(index)}>Submit</button>
                    </div>
                  ) : (
                    result.userAnswer
                  )}
                </td>
                <td>
                  {result.isCorrect === null
                    ? "Waiting for Answer"
                    : result.isCorrect
                    ? "OK"
                    : "FAILED"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
