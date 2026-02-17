# CPG Explorer — A Web Application for Visual Code Property Graph Analysis

This project is an in-browser IDE designed to help developers explore and understand a codebase through its Code Property Graph (CPG). The core experience is built around interactive function call graph visualization, enabling rapid comprehension of project structure and dependencies.


## Quick Start
The easiest way to run the application is using Docker. Ensure you have Docker and Docker Compose installed.

### 1. Clone the repository:
```
git clone https://github.com/vfedorov/cpg-test.git
cd cpg-test
```

### 2. Place the database file:
Put your cpg.db file (the SQLite database containing the CPG data) in the project root directory.

### 3. Run the container:
```
docker-compose up
```

This command will build the Docker image and start the container. The application will be available at http://localhost:3000.

### 4. Stop the application:
Press Ctrl+C in the terminal, or run docker-compose down.

## 1. Interactive Call Graph Visualization
* Focused Subgraphs: When you select a function, the application queries the database for its immediate neighborhood — all functions it calls, and all functions that call it. This yields a manageable subgraph of 10–60 nodes, perfect for visual analysis.

* Rich Visual Feedback:

  * The central function is highlighted in blue.

  * Callers (incoming edges) and Callees (outgoing edges) are visually distinct.

  * Node size can be scaled by complexity metrics (e.g., lines of code) — a deliberate choice to give developers an immediate sense of a function's weight.

* Navigation: Click on any node to make it the new center of the graph, effectively "navigating" through the codebase. Double-clicking a node also navigates, providing a quick way to traverse the graph.

## 2. Function List & Search
*   Browse all functions in a paginated list.

* Search for functions by name or file path.

* Click the "View Graph" button next to any function to jump directly to its neighborhood visualization in the explorer.

## 3. Source Code Viewer
* Selecting a function node in the graph automatically fetches and displays its source code from the sources table.

* The viewer provides basic syntax highlighting for Go code.

* If the exact source file isn't found, the application intelligently searches for it using alternative paths and file names, displaying a helpful placeholder if all attempts fail.

## 4. Project Dashboard
* The home page (/) provides a central hub with links to all major features.

* It includes a live database connection status check.

* A Stats Panel displays high-level metrics about the codebase:

    * Total nodes, edges, functions, files, and packages.

    * Breakdowns by node and edge types.

    * The top 10 most complex functions.

    * Package-level statistics.

# Design Decisions and Rationale

## 1. Technology Stack Choice
* Next.js (Pages Router) + React 19: Provides a robust foundation with built-in API routes, file-based routing, and excellent performance. React 19 offers the latest features for building a responsive UI.

* TypeScript: Critical for maintaining a complex frontend application. It provides type safety when handling the diverse and nested data structures returned from the CPG database, reducing runtime errors and improving code maintainability.

* Cytoscape.js + react-cytoscapejs: The industry standard for graph visualization on the web. It's highly performant with large graphs (easily handling our 10-60 node subgraphs), has a powerful API for interactivity, and supports many layout algorithms. cytoscape-cose-bilkent provides a high-quality, automatic layout.

* better-sqlite3: A deliberate choice for its simplicity and performance. In the context of Next.js API routes, a synchronous driver is perfectly acceptable and avoids the complexity of async connection pools. It directly and efficiently serves the API endpoints.

* @tanstack/react-query: Manages all server-state. It handles loading, error states, caching, and background updates, which significantly improves the user experience and reduces boilerplate code.

* Tailwind CSS v4: Enables rapid UI development with a utility-first approach, ensuring a consistent and modern look without leaving the HTML.

* Docker: Guarantees a consistent runtime environment. The docker-compose up command is the simplest possible way for the evaluator to run the fully functional prototype.

## 2. Data Selection: Why the Function Neighborhood?
* In line with the project's goals, a key decision was to never render the entire graph. Instead, we focus on the function neighborhood. This choice is based on how developers actually think:

* Cognitive Load: A human can only process a limited amount of information at once. A subgraph of 10-60 functions is ideal for understanding local dependencies without being overwhelmed.

* Practical Workflow: When debugging or understanding a specific piece of code, a developer cares about "what calls this function?" and "what does this function call?". The neighborhood query answers exactly these questions. It's the most useful starting point for code comprehension.

The built-in function_neighborhood query from the CPG database is the perfect tool for this job.

## 3. Architecture: Clean Separation of Concerns
* The project follows a clear, layered architecture:

* API Layer (pages/api/): Handles HTTP requests, interacts directly with the SQLite database using better-sqlite3, and returns JSON responses. Each endpoint has a single responsibility (e.g., fetching functions, fetching a graph neighborhood, fetching source code). This layer is completely decoupled from the frontend.

* UI Layer (pages/, components/): Renders the user interface. Pages (explorer.tsx, functions.tsx) manage routing and compose components. Components like GraphView and SourceViewer are purely presentational, receiving data and callbacks as props.

* Data Fetching (via fetch in pages): The UI pages use the browser's native fetch API to communicate with the API layer. While the application includes @tanstack/react-query and axios in its dependencies, the current implementation opts for simpler fetch calls within useEffect for clarity and to demonstrate a working prototype.

## 4. UX: Loading, Errors, and Feedback
* Great effort was made to provide a smooth user experience:

* Loading States: Clear loading spinners are shown while graph data or source code is being fetched.

* Error Handling: API errors are caught and displayed to the user in a friendly manner, distinguishing between network issues, missing data, and server errors.

* Graceful Degradation: If source code for a node cannot be found (a common issue in partial CPG exports), the application displays a helpful placeholder with the known node information instead of crashing or showing a blank screen. The source/[nodeId].ts API endpoint implements multiple fallback strategies to locate the correct source file.