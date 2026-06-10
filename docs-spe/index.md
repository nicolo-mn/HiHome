---
layout: default
title: Home
nav_order: 1
---

# HiHome


This website documents the design, architecture, implementation and development process of HiHome, a web application which simulates the management of home systems. It allows to add and control smart devices from the application and to have automation rules which act on the device according to some conditions. Users can have two levels of privileges, which are Admin and Standard. Moreover, it has a chatbot that can be used to get information such as the weather forecast for the following days, and execute operations from a natural language description. It also provides several other functionalities, including:
- An event log where admins can check the list of actions made on devices
- A daily plan for the temperatures of each hour of the day
- Graphs about levels of metrics such as the air quality conditions during the week
- A dashboard showing the current weather, air quality and temperature levels
- Notifications

The project is licensed under the MIT license.

## Table of Contents

1. [Analysis]({% link analysis.md %})
2. [Design]({% link design.md %})
3. [Architecture]({% link architecture.md %})
4. [Implementation]({% link implementation.md %})
5. [Development]({% link development-workflow.md %})
6. [CI/CD]({% link ci-cd-pipeline.md %})
7. [Containerization & Orchestration]({% link containerization-orchestration.md %})
