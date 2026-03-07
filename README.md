# Grails Test Runner

[![Version](https://img.shields.io/open-vsx/v/alejmendez/grails-test-runner)](https://open-vsx.org/extension/alejmendez/grails-test-runner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Run Grails/Spock tests directly from your editor with CodeLens integration.

![Grails Test Runner Demo](https://raw.githubusercontent.com/alejmendez/grails-test-runner/main/demo.gif)

## ✨ Features

- **CodeLens Integration** - See "Run Test" buttons directly above your test methods and classes
- **Run Individual Tests** - Execute a single test method with one click
- **Run All Tests in Class** - Run all tests in a Spec file at once
- **Rerun Tests** - Force re-execution with `--rerun-tasks`, bypassing Gradle's up-to-date checks
- **Automatic Test Type Detection** - Distinguishes between unit tests and integration tests
- **Terminal Output** - See test results directly in the integrated terminal

## 📦 Installation

### From Open VSX Registry

1. Open **VS Code** or **Cursor**
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for `Grails Test Runner`
4. Click **Install**

### From Command Line

```bash
# For VS Code
code --install-extension alejmendez.grails-test-runner

# For Cursor
cursor --install-extension alejmendez.grails-test-runner
```

### Build from Source

If you want to install the extension from source code:

```bash
git clone https://github.com/alejmendez/grails-test-runner.git
cd grails-test-runner
npm install
npx @vscode/vsce package
```

This generates a `.vsix` file. Then install it with:

```bash
code --install-extension *.vsix
```

## 🚀 Usage

1. Open any `*Spec.groovy` file in your Grails project
2. You'll see CodeLens buttons above your code:
   - **▶ Run All Tests** - Above the class declaration, runs all tests in the file
   - **↺ Rerun All Tests** - Same as above but with `--rerun-tasks` to bypass Gradle cache
   - **▶ Run Test** - Above each test method, runs only that specific test
   - **↺ Rerun Test** - Same as above but with `--rerun-tasks` to bypass Gradle cache
3. Click the button to execute the test in the integrated terminal

## 🧪 Supported Test Types

| Location | Gradle Command |
|----------|----------------|
| `src/test/groovy/` | `./gradlew test --tests "..."` |
| `src/integration-test/groovy/` | `./gradlew integrationTest --tests "..."` |

## 📋 Requirements

- A Grails project with Gradle wrapper (`gradlew`)
- **Groovy Language Support** extension installed
- Spock test files following the `*Spec.groovy` naming convention

## ⚙️ Commands

| Command | Description |
|---------|-------------|
| `Grails Test Runner: Run Test` | Run the test method at cursor position |
| `Grails Test Runner: Run Test Class` | Run all tests in the current file |
| `Grails Test Runner: Rerun Test` | Rerun the test method with `--rerun-tasks` |
| `Grails Test Runner: Rerun Test Class` | Rerun all tests in the current file with `--rerun-tasks` |

## 🛠️ Development

To contribute or modify the extension:

```bash
git clone https://github.com/alejmendez/grails-test-runner.git
cd grails-test-runner
npm install
npm run watch  # Auto-compiles on save
```

Press `F5` in VS Code to launch the Extension Development Host.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

Found a bug or have a feature request? Please open an issue on [GitHub](https://github.com/alejmendez/grails-test-runner/issues).

---

**Enjoy testing your Grails applications!** 🎉
