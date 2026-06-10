---
layout: default
title: Analysis
nav_order: 2
---

# Problem analysis

## Context

An always growing number of houses are introducing smart devices to ease the management of the house and increase the comfort and well-being of the inhabitants. These devices can be very different from one another and should be integrated in an application that allows the users to control them from a centralized place, even remotely, to create automations which act on the devices without the need of direct human control, and to keep the home's energy use and indoor conditions under control.

## Problem statement

Modern households accumulate smart devices from different manufacturers, each typically shipped with its own dedicated app and its own way of being controlled. As the number of devices grows, this fragmentation makes the home harder to manage: there is no single place from which to see the state of every device or to act on it.

Controlling devices one by one, by hand, is also repetitive and reactive. Recurring situations still demand manual attention, because the devices have no shared notion of when an action should happen.

At the same time, the conditions that most affect comfort and well-being inside a home are largely invisible to its inhabitants, who therefore cannot react to a drop in air quality or a weather change.

Finally, a home is rarely used by a single person. Different members need different levels of control: everyone should be able to operate the devices and stay informed, but configuration and management cannot be left open to everyone without risk.

## Proposed solution 

HiHome is a web application that allows users to control their smart devices from a centralized place, to create automations to schedule repetitive actions, to monitor which actions have been performed on the home's devices and devices' usage statistics.

## Roles

The users in the domain are organized in two roles with distinct capabilities:

- the **Admin** represents the highest privileged role. An admin can freely interact with devices, add new devices, create and manage automation rules, set the home's daily temperature plan, and change the role of other users. Role management is constrained by the domain itself: an admin cannot change their own role, cannot manage users of another home, and at least one admin must always remain in a home.
- the **Standard User** role is attributed to a user which can only perform manual actions on the devices. It can see devices' state, it can receive notifications and see home statistics, but it cannot handle rules or add new devices.

# Requirement analysis

## System requirements

The system must:
- enforce role separation, preventing unauthorized users from performing sensitive actions;
- obtain outdoor sensors values from an external weather service and use them to handle rules;
- handle automations by evaluating rules based on the given condition, and should then perform actions on the devices for the rules that have been satisfied;
- send real-time push notifications to the users when actions or sensors updates are performed, according to their notifications preferences;
- allow the user to control the house using natural language through a virtual assistant. 

## Functional requirements

- A user should be able to perform actions on available devices.
- A user should be able to see indoor and outdoor sensors values.
- A user should be able to view the house's usage statistics.
- A user should be able to configure the notifications to receive.
- A user should be able to view the list of events that happened in the home.
- A user should be able to get house information from the virtual assistant.
- An admin should be able to add new devices to his house.
- An admin should be able to create new automation rules.
- An admin should be able to manage and reorder automation rules.
- An admin should be able to set daily temperature planning for the home.
- An admin should be able to change the role of other users in the home.
- An admin should be able to create new automation rules using the virtual assistant.

## Non-functional requirements

- The backend should target two different platforms (Go and NodeJS).
- The build and deployment should be fully automated, containerized with Docker and orchestrated with Docker Compose.
- The frontend should be a mobile-first web application designed as a Single Page Application with a REST API backend.


# Domain model

## Ubiquitous language

The codebase has been handled with a set of terms which definitions are clearly defined:

|**Term** | **Context** | **Definition**|
|---------|-------------|---------------|
| Home | Home | A single dwelling, identified and located by geographic coordinates; it owns its rooms, daily temperature plan and event log. |
| Room | Home | A named subdivision of a home that groups devices. |
| Device | Home | A controllable smart device belonging to a room; specialised as Light, Window, Thermostat, Fan and Lock. |
| Device Event | Home | An immutable record of an action performed on a device, carrying timestamp and actor; the ordered history of these events forms the home's event log. |
| Sensor State | Home | The current readings associated with a home: internal and external temperature, air quality (AQI), wind and weather. |
| Rule | Rule | An automation linking a condition to a list of actions, belonging to a home and carrying an evaluation order (priority). |
| Condition | Rule | A predicate over an observed value (temperature, air quality, wind speed or weather) that decides whether a rule fires. |
| Action | Rule | An operation a rule applies automatically to a device (eg. turn light on/off, open/close window, set thermostat temperature). |
| User | User | A person belonging to a home, with a username and a role. |
| Role | User | A user's privilege level: Admin or Standard User. |
| Notification | Notification | A message delivered to a user, with a type (air-quality breach, rule executed, device action), content and read/unread state. |
| Notification Preference | Notification | The per-home, per-user selection of notification types the user has opted in to receive. |
| Forecast | Environment | Weather and air-quality data retrieved from the external service for a home's coordinates. |

## Bounded contexts

The domain is divided in five bounded contexts:
- **Home**: handles the homes, the devices and the sensors in it, keeps the event log and usage statistics and the home's daily temperature plan, provides the actions for other contexts to interact with the devices, and handles the chatbot functionality.
- **Rule**: represents the automations engine, allows for the creation of rules and their execution. It interacts with the Home by means of an event bus to get the necessary inputs for the rules evaluation, and by means of ports to execute the automatic actions on devices.
- **User**: handles the users, providing login functionalities and roles validation.
- **Notification**: takes care of notification delivery to users, managing and storing the per-user notification preferences. It receives updates from other contexts, queries the user context for the members of a home and their roles, and makes decisions over which notifications should be delivered to who.
- **Environment**: acts as an interface to handle the external service from which the application gets outdoor sensors updates. It queries the external service through a set of APIs and returns the sensors values to the home context.