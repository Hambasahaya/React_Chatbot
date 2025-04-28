import React, { useState, useRef } from 'react';
import './App.css';

const AskQuestion = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const handleInputChange = (e) => {
    setQuestion(e.target.value);
  };

  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (question.trim()) {
      setMessages((prev) => [...prev, { text: question, type: 'user' }]);
      await sendQuestion('text', question);
      setQuestion('');
    }
  };

  const sendQuestion = async (inputType, content) => {
    setLoading(true);
    setError('');

    try {
      let formData = new FormData();
      formData.append('input_type', inputType);

      if (inputType === 'text') {
        formData.append('text', content);
      } else if (inputType === 'audio') {
        formData.append('file', content, 'audio.webm');
      }

      const res = await fetch('http://127.0.0.1:500/predict/', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: data.data.respons, type: 'server' },
        ]);
      } else {
        setError(data.detail || 'Gagal mas, cek server mas');
      }
    } catch (err) {
      console.error(err);
      setError('Server mati mas!');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      const localAudioChunks = []; // <- temporary di dalam fungsi
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          localAudioChunks.push(event.data);
        }
      };
  
      mediaRecorder.onstop = async () => {
        if (localAudioChunks.length === 0) {
          console.error("No audio chunks captured!");
          setError("Gagal merekam suara. Coba lagi mas!");
          return;
        }
  
        const audioBlob = new Blob(localAudioChunks, { type: 'audio/webm' });
  
        console.log("Blob Size:", audioBlob.size); // Debugging
  
        if (audioBlob.size < 1000) {
          console.error("Recorded audio too small!");
          setError("Rekaman terlalu kecil atau kosong. Coba rekam lebih lama.");
          return;
        }
  
        setMessages((prev) => [...prev, { text: '[Voice Message]', type: 'user' }]);
        await sendQuestion('audio', audioBlob);
      };
  
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone', error);
      setError('Tidak bisa akses microphone!');
    }
  };
  
  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  

  return (
    <div className="chat-container">
      <h1>TESTINGIN MAS!</h1>

      <div className="chat-room">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${message.type === 'user' ? 'user' : 'server'}`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmitText} className="chat-form">
        <input
          type="text"
          value={question}
          onChange={handleInputChange}
          placeholder="pilih dah"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'bentar mikir yaaa...' : 'Ask'}
        </button>
      </form>

      <div className="record-controls">
        {!isRecording ? (
          <button type="button" onClick={startRecording} disabled={loading}>
            🎙 Start Recording
          </button>
        ) : (
          <button type="button" onClick={stopRecording}>
            ⏹ Stop Recording
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AskQuestion;
