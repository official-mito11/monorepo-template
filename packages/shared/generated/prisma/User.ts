import { Type } from "@sinclair/typebox";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UserPlain = Type.Object(
  { id: Type.String(), createdAt: Type.Date(), updatedAt: Type.Date() },
  { additionalProperties: false },
);

export const UserRelations = Type.Object({}, { additionalProperties: false });

export const UserWhere = Type.Partial(
  Type.Recursive(
    (Self) =>
      Type.Object(
        {
          AND: Type.Union([
            Self,
            Type.Array(Self, { additionalProperties: false }),
          ]),
          NOT: Type.Union([
            Self,
            Type.Array(Self, { additionalProperties: false }),
          ]),
          OR: Type.Array(Self, { additionalProperties: false }),
          id: Type.String(),
          createdAt: Type.Date(),
          updatedAt: Type.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "User" },
  ),
);

export const UserWhereUnique = Type.Recursive(
  (Self) =>
    Type.Intersect(
      [
        Type.Partial(
          Type.Object({ id: Type.String() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        Type.Union([Type.Object({ id: Type.String() })], {
          additionalProperties: false,
        }),
        Type.Partial(
          Type.Object({
            AND: Type.Union([
              Self,
              Type.Array(Self, { additionalProperties: false }),
            ]),
            NOT: Type.Union([
              Self,
              Type.Array(Self, { additionalProperties: false }),
            ]),
            OR: Type.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        Type.Partial(
          Type.Object(
            {
              id: Type.String(),
              createdAt: Type.Date(),
              updatedAt: Type.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "User" },
);

export const UserSelect = Type.Partial(
  Type.Object(
    {
      id: Type.Boolean(),
      createdAt: Type.Boolean(),
      updatedAt: Type.Boolean(),
      _count: Type.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UserInclude = Type.Partial(
  Type.Object({ _count: Type.Boolean() }, { additionalProperties: false }),
);

export const UserOrderBy = Type.Partial(
  Type.Object(
    {
      id: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: Type.Union([Type.Literal("asc"), Type.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const User = Type.Composite([UserPlain, UserRelations], {
  additionalProperties: false,
});
