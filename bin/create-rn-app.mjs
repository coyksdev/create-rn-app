#!/usr/bin/env node
import { exec } from 'child_process';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs';

const AppTemplate = `import React from 'react';
import {NativeBaseProvider, Center} from 'native-base';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <NativeBaseProvider>
      <QueryClientProvider client={queryClient}>
        <Center flex={1}>Hello world</Center>
      </QueryClientProvider>
    </NativeBaseProvider>
  );
}
`;

const execAsync = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout || stderr);
    });
  });

let { cli, projectName } = await inquirer.prompt([
  {
    type: 'list',
    name: 'cli',
    message: 'Choose a CLI:',
    choices: ['Expo', 'React Native CLI'],
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return 'Please choose a CLI.';
      }
    },
  },
  {
    type: 'input',
    name: 'projectName',
    message: 'Enter your project name:',
    validate: function (value) {
      if (value.length) {
        return true;
      } else {
        return 'Please enter your project name.';
      }
    },
  },
]);

const command =
  cli === 'Expo'
    ? 'npx create-expo-app@latest'
    : 'npx react-native@latest init';

let spinner = ora('Generating project...').start();

try {
  if (cli === 'Expo') {
    await execAsync(
      `${command} ${projectName} --template expo-template-blank-typescript`
    );
  } else {
    projectName = projectName.replace(/-|\s/g, '_');
    await execAsync(`${command} ${projectName}`);
  }
} catch (error) {
  spinner.fail(`${error}`);
}

spinner.info('Installing dependencies...');

try {
  process.chdir(projectName);
  await execAsync(
    'yarn add native-base react-native-svg react-native-safe-area-context @tanstack/react-query --exact'
  );

  fs.writeFileSync('App.tsx', AppTemplate);

  spinner.succeed(`Project "${projectName}" generated successfully!`);
} catch (error) {
  spinner.fail(`${error}`);
}
