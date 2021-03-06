import { fs, vol } from 'memfs';
import * as path from 'path';

import { UnexpectedError } from '../../Errors';
import { addWarningIOS } from '../../WarningAggregator';
import { getAppDelegate, getXcodeProjectPath } from '../Paths';
const actualFs = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

jest.mock('../../WarningAggregator', () => ({
  addWarningIOS: jest.fn(),
}));

afterAll(() => {
  jest.unmock('fs');
  jest.unmock('../../WarningAggregator');
});

describe(getXcodeProjectPath, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    // More than one
    vol.fromJSON(
      {
        'ios/otherproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      '/multiple'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`returns project path`, () => {
    expect(getXcodeProjectPath('/app')).toBe('/app/ios/testproject.xcodeproj');
  });

  it(`throws when no paths are found`, () => {
    expect(() => getXcodeProjectPath('/none')).toThrow(UnexpectedError);
  });

  it(`warns when multiple paths are found`, () => {
    expect(getXcodeProjectPath('/multiple')).toBe('/multiple/ios/otherproject.xcodeproj');
    expect(addWarningIOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "/multiple/ios/otherproject.xcodeproj". Ignored paths: ["/multiple/ios/testproject.xcodeproj"]'
    );
  });
});

describe(getAppDelegate, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.m': '',
        'ios/testproject/AppDelegate.h': '',
      },
      '/objc'
    );

    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.swift': '',
      },
      '/swift'
    );

    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
      },
      '/invalid'
    );

    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': actualFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.swift': '',
        'ios/testproject/AppDelegate.m': '',
        'ios/testproject/AppDelegate.h': '',
      },
      '/confusing'
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`returns objc path`, () => {
    expect(getAppDelegate('/objc')).toStrictEqual({
      path: '/objc/ios/testproject/AppDelegate.m',
      language: 'objc',
    });
  });
  it(`returns swift path`, () => {
    expect(getAppDelegate('/swift')).toStrictEqual({
      path: '/swift/ios/testproject/AppDelegate.swift',
      language: 'swift',
    });
  });

  it(`throws on invalid project`, () => {
    expect(() => getAppDelegate('/invalid')).toThrow(UnexpectedError);
    expect(() => getAppDelegate('/invalid')).toThrow(/AppDelegate/);
  });

  it(`warns when multiple paths are found`, () => {
    expect(getAppDelegate('/confusing')).toStrictEqual({
      path: '/confusing/ios/testproject/AppDelegate.m',
      language: 'objc',
    });
    expect(addWarningIOS).toHaveBeenLastCalledWith(
      'paths-app-delegate',
      'Found multiple AppDelegate file paths, using "/confusing/ios/testproject/AppDelegate.m". Ignored paths: ["/confusing/ios/testproject/AppDelegate.swift"]'
    );
  });
});
