jest.mock('@actions/core');
jest.mock('@actions/github');
jest.mock('fs');

const core = require('@actions/core');
const { GitHub, context } = require('@actions/github');
const fs = require('fs');
const run = require('../src/upload-release-asset');

/* eslint-disable no-undef */
describe('Upload Release Asset', () => {
  let uploadReleaseAsset;
  let content;

  beforeEach(() => {
    uploadReleaseAsset = jest.fn().mockReturnValueOnce({
      data: {
        browser_download_url: 'browserDownloadUrl'
      }
    });

    fs.statSync = jest.fn().mockReturnValueOnce({
      size: 527
    });

    content = Buffer.from('test content');
    fs.readFileSync = jest.fn().mockReturnValueOnce(content);

    context.repo = {
      owner: 'owner',
      repo: 'repo'
    };

    const github = {
      repos: {
        uploadReleaseAsset
      }
    };

    GitHub.mockImplementation(() => github);
  });

  test('Upload release asset endpoint is called', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    await run();

    expect(uploadReleaseAsset).toHaveBeenCalledWith({
      url: 'upload_url',
      headers: { 'content-type': 'asset_content_type', 'content-length': 527 },
      name: 'asset_name',
      file: content
    });
  });

  test('Output is set', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    core.setOutput = jest.fn();

    await run();

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'browser_download_url', 'browserDownloadUrl');
  });

  test('Action fails elegantly', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    uploadReleaseAsset.mockRestore();
    uploadReleaseAsset.mockImplementation(() => {
      throw new Error('Error uploading release asset');
    });

    core.setOutput = jest.fn();

    core.setFailed = jest.fn();

    await run();

    expect(uploadReleaseAsset).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Error uploading release asset');
    expect(core.setOutput).toHaveBeenCalledTimes(0);
  });

  test('zero file size fail', async () => {
    content = Buffer.from('');
    fs.readFileSync = jest.fn().mockReturnValueOnce(content);
    core.getInput = jest.fn().mockReturnValueOnce('contentLength');
    core.setOutput = jest.fn();
    await run();
    expect(core.setOutput).toBe(0);
  });

  // test('empty file error', () => {
  //   function drinkOctopus() {
  //     contentLength('');
  //   }
  //
  //   // Test that the error message says "yuck" somewhere: these are equivalent
  //   expect(drinkOctopus).toThrowError(/yuck/);
  //   expect(drinkOctopus).toThrowError('yuck');
  //
  //   // Test the exact error message
  //   expect(drinkOctopus).toThrowError(/^yuck, octopus flavor$/);
  //   expect(drinkOctopus).toThrowError(new Error('yuck, octopus flavor'));
  //
  //   // Test that we get a DisgustingFlavorError
  //   expect(drinkOctopus).toThrowError(DisgustingFlavorError);
  // });

  // test('has no content', () => {
  //     function drinkOctopus() {
  //       contentLength('');
  //     }
  //   expect(drinkOctopus).toBe(0);
  // });
});
