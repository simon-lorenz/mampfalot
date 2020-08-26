import { Comment } from './comment'
import { User } from './user'
import { Lunchbreak } from './lunchbreak'
import { Group } from './group'
import { Place } from './place'
import { GroupMember } from './groupMember'
import { GroupMemberConfig } from './group-member-config'
import { Participant } from './participant'
import { Vote } from './vote'
import { Invitation } from './invitation'
import { Participation } from './participation'

interface IFactory {
  createNewInstance(json)
}

class CommentFactory implements IFactory {

  createNewInstance(json: any): Comment {
    const comment = new Comment()
    Object.assign(comment, json)
    comment.author = groupMemberFactory.createNewInstance(json.author)
    return comment
  }

}

class GroupFactory implements IFactory {

  createNewInstance(json: any): Group {
    const group = new Group()
    Object.assign(group, json)

    if (json.members) {
      group.members = json.members.map(member => {
        return groupMemberFactory.createNewInstance(member)
      })
    }

    if (json.places) {
      group.places = json.places.map(place => {
        return placeFactory.createNewInstance(place)
      })
    }

    return group
  }

}

class InvitationFactory implements IFactory {

  createNewInstance(json: any): Invitation {
    const invitation = new Invitation()
    Object.assign(invitation, json)

    if (json.group) {
      invitation.group = groupFactory.createNewInstance(invitation.group)
    }

    if (json.from) {
      invitation.from = userFactory.createNewInstance(invitation.from)
    }

    if (json.to) {
      invitation.to = userFactory.createNewInstance(invitation.to)
    }

    return invitation
  }
}

class GroupMemberFactory implements IFactory {

  createNewInstance(json: any): GroupMember {
    const groupMember = new GroupMember()
    Object.assign(groupMember, json)

    if (json.config) {
      groupMember.config = groupMemberConfigFactory.createNewInstance(json.config)
    }

    return groupMember
  }

}

class GroupMemberConfigFactory implements IFactory {

  createNewInstance(json: any): GroupMemberConfig {
    const groupMemberConfig = new GroupMemberConfig()
    Object.assign(groupMemberConfig, json)
    return groupMemberConfig
  }

}

class LunchbreakFactory implements IFactory {

  createNewInstance(json: any): Lunchbreak {
    const lunchbreak = new Lunchbreak()
    Object.assign(lunchbreak, json)

    if (json.participants) {
      lunchbreak.participants = json.participants.map(participant => {
        return participantFactory.createNewInstance(participant)
      })
    }

    if (json.responseless) {
      lunchbreak.responseless = json.responseless.map(groupMember => {
        return groupMemberFactory.createNewInstance(groupMember)
      })
    }

    if (json.absent) {
      lunchbreak.absent = json.absent.map(groupMember => {
        return groupMemberFactory.createNewInstance(groupMember)
      })
    }

    if (json.comments) {
      lunchbreak.comments = json.comments.map(comment => {
        return commentFactory.createNewInstance(comment)
      })
    }

    return lunchbreak
  }

}

class ParticipantFactory implements IFactory {

  createNewInstance(json: any): Participant {
    const participant = new Participant()

    if (json.member) {
      participant.member = groupMemberFactory.createNewInstance(json.member)
    }

    if (json.votes) {
      participant.votes = json.votes.map(vote => {
        return voteFactory.createNewInstance(vote)
      })
    }

    return participant
  }

}

class ParticipationFactory implements IFactory {

  createNewInstance(json: any): Participation {
    const participation = new Participation()
    participation.votes = json.votes.map(vote => voteFactory.createNewInstance(vote))
    return participation
  }

}

class PlaceFactory implements IFactory {

  createNewInstance(json: any): Place {
    const place = new Place()
    Object.assign(place, json)
    return place
  }

}

class UserFactory implements IFactory {

  createNewInstance(json: any): User {
    const user = new User()
    Object.assign(user, json)
    return user
  }

}

class VoteFactory implements IFactory {

  createNewInstance(json: any): Vote {
    const vote = new Vote()
    Object.assign(vote, json)

    if (json.place) {
      vote.place = placeFactory.createNewInstance(json.place)
    }

    return vote
  }

}

export const commentFactory = new CommentFactory()
export const groupFactory = new GroupFactory()
export const groupMemberFactory = new GroupMemberFactory()
export const groupMemberConfigFactory = new GroupMemberConfigFactory()
export const invitationFactory = new InvitationFactory()
export const lunchbreakFactory = new LunchbreakFactory()
export const participantFactory = new ParticipantFactory()
export const participationFactory = new ParticipationFactory()
export const placeFactory = new PlaceFactory()
export const userFactory = new UserFactory()
export const voteFactory = new VoteFactory()
