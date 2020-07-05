import {oldBranchNotify} from '../src/old-branch-notify'
import * as GitHub from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {
  ReposListBranchesResponseData,
  OctokitResponse,
  ReposGetBranchResponseData,
  IssuesCreateResponseData
} from '@octokit/types'

let context: Context
let listBranchesData: ReposListBranchesResponseData
let listBranchesResponse: OctokitResponse<ReposListBranchesResponseData>
let getBranchResponse: OctokitResponse<ReposGetBranchResponseData>
let getBranchData: ReposGetBranchResponseData
let issuesCreateResponse: OctokitResponse<IssuesCreateResponseData>
let listBranchesSpy: jest.SpyInstance
let getBranchesSpy: jest.SpyInstance
let createIssueSpy: jest.SpyInstance
const octokit = GitHub.getOctokit('fakeToken')
let getInput: (parameter: string) => string
let excludedAuthor: string
let setFailed = jest.fn()

// Context coming from github action
beforeEach(() => {
  context = {
    repo: {
      repo: 'some-repo',
      owner: 'some-owner'
    }
  } as Context
})

// Set up API responses
beforeEach(() => {
  listBranchesData = [
    {
      name: 'master'
    }
  ] as ReposListBranchesResponseData

  listBranchesResponse = {
    data: listBranchesData
  } as OctokitResponse<ReposListBranchesResponseData>

  getBranchData = {
    name: 'master',
    protected: false,
    commit: {
      author: {
        login: 'peterjgrainger'
      },
      commit: {
        author: {
          name: 'Peter Grainger',
          date: '2012-03-06T15:06:50-08:00'
        }
      }
    }
  } as ReposGetBranchResponseData

  getBranchResponse = {
    data: getBranchData
  } as OctokitResponse<ReposGetBranchResponseData>

  issuesCreateResponse = {} as OctokitResponse<IssuesCreateResponseData>
})

// Set API responses in mocks
beforeEach(async () => {
  listBranchesSpy = jest
    .spyOn(octokit.repos, 'listBranches')
    .mockResolvedValue(listBranchesResponse)
  getBranchesSpy = jest
    .spyOn(octokit.repos, 'getBranch')
    .mockResolvedValue(getBranchResponse)
  createIssueSpy = jest
    .spyOn(octokit.issues, 'create')
    .mockResolvedValue(issuesCreateResponse)
})

beforeEach(async () => {
  getInput = (input: string) => (input === 'daysOld' ? '30' : excludedAuthor)
})

test('expect get branch to to be called', async () => {
  await triggerEvent()
  expect(getBranchesSpy).toHaveBeenCalledWith({
    owner: 'some-owner',
    repo: 'some-repo',
    branch: 'master'
  })
})

test('expect list branches to be called', async () => {
  await triggerEvent()
  expect(listBranchesSpy).toHaveBeenCalledWith({
    protected: false,
    owner: 'some-owner',
    repo: 'some-repo',
    per_page: 100
  })
})

test('expect an issue to be created if includes old branches', async () => {
  await triggerEvent()
  expect(createIssueSpy).toHaveBeenCalledWith({
    repo: 'some-repo',
    owner: 'some-owner',
    title: 'Old branches ' + new Date().toString().slice(0, 15),
    assignees: ['peterjgrainger'],
    body:
      '## Branches older than 30 days\nmaster: last commit by @peterjgrainger'
  })
})

test('expect no issues to be created if branch was last commit was today', async () => {
  getBranchData.commit.commit.author.date = new Date().toString()
  await triggerEvent()
  expect(createIssueSpy).not.toHaveBeenCalled()
})

test('expect no issues to be created if there are no branches', async () => {
  listBranchesResponse.data = []
  await triggerEvent()
  expect(createIssueSpy).not.toHaveBeenCalled()
})

test('expect no issues to be created if there are no branches', async () => {
  listBranchesResponse.data = []
  await triggerEvent()
  expect(createIssueSpy).not.toHaveBeenCalled()
})

test('expect no issues to be created if author is excluded', async () => {
  excludedAuthor = 'peterjgrainger'
  await triggerEvent()
  expect(createIssueSpy).not.toHaveBeenCalled()
})

describe('when author has left GitHub', () => {
  beforeEach(() => {
    getBranchData.commit.author = (null as unknown) as {
      gravatar_id: string
      avatar_url: string
      url: string
      id: number
      login: string
    }
    getBranchData.commit.commit.author = (null as unknown) as {
      name: string
      date: string
      email: string
    }
  })

  test('expect unknown author if user has left github', async () => {
    await triggerEvent()
    expect(createIssueSpy).not.toHaveBeenCalled()
  })

  test('expect setFailed to not have been called', async () => {
    await triggerEvent()
    expect(setFailed).not.toHaveBeenCalled()
  })
})

async function triggerEvent() {
  await oldBranchNotify({
    octokit,
    context,
    getInput: getInput,
    debug: jest.fn(),
    setFailed: setFailed
  })
}
