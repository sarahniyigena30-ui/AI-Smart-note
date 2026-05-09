# Project Brief

## Project Title

AI Web-Based Smart Note System for Conversation Recording and Deep Summarization

## Project Description

This project proposes and implements a web-based AI smart note system that records conversations such as meetings, interviews, discussions, and academic consultations. The system captures audio through a web interface, stores the conversation securely, processes transcript text using internal NLP techniques, and generates structured notes that include summaries, key points, decisions, action items, topics, keywords, insights, and question-answer pairs.

The system is designed to operate without external AI APIs. This makes the project more independent, cost-effective, and suitable for academic evaluation because the core analysis is handled inside the application.

## Problem Statement

In meetings, interviews, and discussions, participants often struggle to take complete and accurate notes while also following the conversation. Important points, decisions, questions, and follow-up tasks may be missed or forgotten. Existing note-taking tools often focus on recording audio or storing plain text, but they do not always organize the conversation into meaningful, searchable, and reviewable information.

## Proposed Solution

The proposed system provides a single web platform for recording conversations, managing transcripts, and generating structured summaries. After a conversation is recorded or uploaded, the system stores the audio and transcript, applies internal NLP analysis, and presents organized notes that users can search, review, download, or delete.

## Difference From Existing Systems

Unlike ordinary note-taking or recording applications, this system does not only save audio or text. It analyzes the transcript to identify important discussion elements such as key points, decisions, action items, topics, keywords, and questions. It is also built to avoid dependence on external AI APIs, which supports project ownership, affordability, and academic demonstration.

## System Workflow

1. The user records a conversation or uploads an audio file through the web interface.
2. The system securely captures and stores the audio.
3. Transcript text is captured during live recording where browser support is available, or provided manually for uploaded audio.
4. The backend stores the transcript and conversation metadata.
5. Internal NLP processing analyzes the transcript.
6. The system extracts key points, decisions, action items, topics, keywords, insights, and questions.
7. A structured summary is generated.
8. The user can view, search, play, download, or delete saved conversations and summaries.

## User Stories

| Story | User Story |
| --- | --- |
| Story 1 - Conversation Recording | As a user, I want to record real-time conversations through the web interface so that audio is captured securely for processing. |
| Story 2 - Speech to Text | As a user, I want the system to capture transcript text during live recording or accept a provided transcript so that conversations can be analyzed without external APIs. |
| Story 3 - NLP Analysis | As a developer, I want to apply internal NLP techniques to transcript text so that key topics, decisions, questions, and action items are identified. |
| Story 4 - Deep Structured Summarization | As a user, I want the system to generate structured summaries from conversations so that I can quickly review important points and decisions. |
| Story 5 - Topic and Keyword Extraction | As a user, I want the system to extract important topics and keywords so that I can understand the main discussion themes. |
| Story 6 - Storage and Retrieval | As a user, I want recorded conversations and summaries stored securely so that I can retrieve and review them anytime. |
| Story 7 - User Interface | As a user, I want a simple web interface to start recordings, upload audio, view transcriptions, and read summaries so that the system is easy to use on any device. |
| Story 8 - System Evaluation | As a researcher, I want to compare generated summaries with manual notes so that I can measure system accuracy, usefulness, and efficiency. |

## Evaluation Plan

The system can be evaluated by comparing generated summaries with manually prepared notes from selected meetings, interviews, or discussions. Evaluation should consider the accuracy of extracted key points, correctness of decisions and action items, relevance of topics and keywords, review time saved, and user satisfaction.
